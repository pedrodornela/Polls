//Framework com arquitetura baseada em plugins
import fastify from 'fastify'

import cookie from '@fastify/cookie'
import websocket  from '@fastify/websocket'

//Biblioteca que válida dados 
import { z } from 'zod'

import { createPoll } from './routes/create-polls'
import { getPoll } from './routes/get-polls'
import { voteOnPoll } from './routes/vote-on-poll'
import { pollResults } from './ws/poll-results'

//Inicializa o servidor
const app = fastify()

app.register(cookie, {
    secret: "pollsAppNLW",
    hook: "onRequest",
    
})

app.register(websocket)

app.register(createPoll)
app.register(getPoll)
app.register(voteOnPoll)
app.register(pollResults)

//O servidor ficará ouvindo a conexão e a mantendo atualizada, 
//enviando a mensagem do console.log
app.listen({ port: 3333 }).then(() => {
    console.log('HTTP server running!')
})

