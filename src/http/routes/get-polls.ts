import z from "zod"
import { prisma } from "../../lib/prisma"
import { FastifyInstance } from "fastify"
import { redis } from "../../lib/redis"

export async function getPoll(app: FastifyInstance) {
    //Declara a rota
    app.get('/polls/:pollId', async (request, reply) => {
        //Espera quais dados estejam no body
        const getPollParams = z.object({
            pollId: z.string().uuid(),
        })

        //Valida se os dados estam no body
        const { pollId } = getPollParams.parse(request.params)

        //Cria no Banco de Dados, guardando o campo obrigatório 'title'
        const poll = await prisma.poll.findUnique({
            where: {
                id: pollId,
            },
            include: {
                options: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        })

        if (!poll) {
            return reply.status(400).send({ messsage: 'Poll not found.' })
        }

        const result = await redis.zrange(pollId, 0, -1, 'WITHSCORES')

        const votes = result.reduce((obj, line, index) => {
            if (index % 2 == 0) {
                const score = result[index + 1]

                Object.assign(obj, { [line]: Number(score) })
            }

            return obj

        }, {} as Record<string, number>)

        console.log(votes)

        return reply.send({
            poll: {
                id: poll.id,
                title: poll.title,
                options: poll.options.map(option =>{
                    return {
                        id: option.id,
                        title: option.title,
                        score: (option.id in votes) ? votes[option.id] : 0
                    }
                })
            }
        })
    })
} 