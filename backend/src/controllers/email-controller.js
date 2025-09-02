import { knexConfig } from '../db/index.js';
import { MOCK_USER_SESSION } from '../../mock/userSession.js';

export const sendEmail = async (req, reply) => {
    const { to, subject, body, cc, bcc } = req.body;
    const { sender, email: senderEmail } = MOCK_USER_SESSION;
    // add validation
    try {
        const email = await knexConfig('emails')
            .insert({
                to,
                subject,
                body,
                cc,
                bcc,
                sender,
                senderEmail,
            })
            .returning('*');
        reply.send(email);
    } catch (error) {
        reply.status(500).send(error);
    }
}

export const getEmails = async (req, reply) => {
    const emails = await knexConfig('emails').select('*').orderBy('created_at', 'desc');
    reply.send(emails);
}