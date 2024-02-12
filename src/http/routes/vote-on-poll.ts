import z from "zod"
import { randomUUID } from "node:crypto"
import { prisma } from "../../lib/prisma"
import { FastifyInstance } from "fastify"
import { redis } from "../../lib/redis"
import { voting } from "../../utils/voting-pub-sub"

export async function voteOnPoll(app: FastifyInstance) {
    //Declara a rota
    app.post('/polls/:pollId/votes', async (request, reply) => {
        //Espera quais dados estejam no body
        const voteOnPollBody = z.object({
            pollOptionId: z.string().uuid()
        })

        const voteOnPollParams = z.object({
            pollId: z.string().uuid()
        })


        const { pollOptionId } = voteOnPollBody.parse(request.body)
        const { pollId } = voteOnPollParams.parse(request.params)

        let { sessionId } = request.cookies

        if (sessionId) {
            const userPreviousVoteOnPoll = await prisma.vote.findUnique({
                where: {
                    sessionId_pollId: {
                        sessionId,
                        pollId
                    },
                }
            })
            //Se já votou na enquete e o voto é diferente do voto que ele ja fez antes
            if (userPreviousVoteOnPoll && userPreviousVoteOnPoll.pollOptionId != pollOptionId) {
                //Deleta o voto
                await prisma.vote.delete({
                    where: {
                        id: userPreviousVoteOnPoll.id,
                    }
                })

                const votes = await redis.zincrby(pollId, -1, userPreviousVoteOnPoll.pollOptionId)

                voting.publish(pollId, {
                    pollOptionId: userPreviousVoteOnPoll.pollOptionId,
                    votes: Number(votes)
                })

            }
            else if (userPreviousVoteOnPoll) {
                return reply.status(400).send({ message: 'You already voted on this poll.' })
            }
        }

        if (!sessionId) {
            sessionId = randomUUID()

            reply.setCookie('sessionId', sessionId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 30, //30 days 
                signed: true, // O usuário não irá conseguir alterar este cookie manualmente
                httpOnly: true // Somente o backend terá acesso a essa informação
            })
        }

        await prisma.vote.create({
            data: {
                sessionId,
                pollId,
                pollOptionId
            }
        })

        // Incrementa em 1, o ranque da opção dentro da enquete
        const votes = await redis.zincrby(pollId, 1, pollOptionId)

        voting.publish(pollId, {
            pollOptionId,
            votes: Number(votes)
        })

        return reply.status(201).send()
    })
} 