export const ping = async (request, reply) => {
    return reply.send('pong\n');
}