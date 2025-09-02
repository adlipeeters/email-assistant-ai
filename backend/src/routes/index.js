import { ping } from '../controllers/health-controller.js';
import { getEmails, sendEmail } from '../controllers/email-controller.js';
import { streamGeneratedAIEmail } from '../controllers/ai-controller.js';

export default async function routes(fastify, options) {
  // ping
  fastify.get('/ping', ping);
  // stream generated ai email
  fastify.post('/api/ai/generate/stream', streamGeneratedAIEmail);
  // send email
  fastify.post('/api/email/send', sendEmail);
  // get all emails
  fastify.get('/api/email/get-all', getEmails);
}


