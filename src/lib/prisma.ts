//Importa o Banco de Dados
import {PrismaClient} from '@prisma/client'

//Realiza conexão com o Banco de Dados
export const prisma = new PrismaClient({
    log: ['query']
})