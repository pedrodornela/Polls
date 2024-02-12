import z from "zod"
import { prisma } from "../../lib/prisma"
import { FastifyInstance } from "fastify"

export async function createPoll(app: FastifyInstance) {
    //Declara a rota
    app.post('/polls', async (request, reply) => {
        //Espera quais dados estejam no body
        const createPollBody = z.object({
            title: z.string(),
            options: z.array(z.string())
        })

        //Valida se os dados estam no body
        const { title, options } = createPollBody.parse(request.body)

        //Cria no Banco de Dados, guardando o campo obrigatório 'title'
        const poll = await prisma.poll.create({
            data: {
                title,
                options: {
                    createMany: {
                        data: options.map(option => {
                            return { title: option }
                        }),
                    }
                },
            }
        })


        return reply.status(201).send({ pollId: poll.id })
    })
} 