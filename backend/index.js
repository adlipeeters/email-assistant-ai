// ESM
import Fastify from 'fastify';
import routes from './src/routes/index.js';
import cors from '@fastify/cors';

/**
 * @type {import('fastify').FastifyInstance} Instance of Fastify
 */
const fastify = Fastify({
  logger: true
});

await fastify.register(cors, {
  origin: true,  // Allow all origins in development
  credentials: true
});

fastify.register(routes);

fastify.listen({ port: process.env.PORT }, function (err, address) {
  console.log(`Server is running on ${address}`);
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
