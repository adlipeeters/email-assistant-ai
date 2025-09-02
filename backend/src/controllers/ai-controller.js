import { LLMService } from '../services/llm-service.js';


const llmService = new LLMService('claude');
// const llmService = new LLMService('openai');
// const llmService = new LLMService('gemini');

export const streamGeneratedAIEmail = async (request, reply) => {
    try {
        const { prompt, to } = request.body;

        if (!prompt) {
            return reply.status(400).send({ error: 'Prompt is required' });
        }

        reply
            .header('Content-Type', 'text/event-stream')
            .header('Cache-Control', 'no-cache')
            .header('Connection', 'keep-alive');

        const { Readable } = await import('stream');
        let streamEnded = false;

        const stream = new Readable({
            read() { }
        });

        request.raw.on('close', () => {
            if (!streamEnded) {
                streamEnded = true;
                stream.push(null);
            }
        });


        const generationPromise = llmService.generateEmailStream(prompt, to, (chunk) => {
            if (!streamEnded) {
                stream.push(`data: ${JSON.stringify(chunk)}\n\n`);
            }
        });

        generationPromise.then(() => {
            if (!streamEnded) {
                streamEnded = true;
                stream.push(null);
            }
        }).catch((error) => {
            if (!streamEnded) {
                streamEnded = true;
                stream.push(`data: ${JSON.stringify({ type: 'error', data: { error: error.message } })}\n\n`);
                stream.push(null);
            }
        });

        return reply.send(stream);
    } catch (error) {
        // Here we can use a direct LLM call to generate the email instead of streaming or to implement retry logic with another model
        fastify.log.error('Alternative streaming error:', error);
        return reply.status(500).send({ error: 'Failed to generate email stream' });
    }
}