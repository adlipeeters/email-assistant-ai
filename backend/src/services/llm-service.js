import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import 'dotenv/config';
import { MOCK_USER_SESSION } from '../../mock/userSession.js';

const ROUTER_PROMPT = `You are a router assistant. Analyze the user's email request and classify it into one of these categories:

SALES: For sales emails, pitches, business development, product demos, proposals, cold outreach
FOLLOWUP: For follow-up emails, checking in, reminders, status updates, touching base

Respond with ONLY the category name: "SALES" or "FOLLOWUP"

User request: `;

const SALES_ASSISTANT_PROMPT = `You are a sales email specialist. Generate professional, concise sales emails tailored to the recipient's business.

RULES:
- Keep total email under 40 words (must be readable in under 10 seconds)
- Use 7-10 words per sentence maximum  
- Tailor content to recipient's business/industry when provided
- Be direct and value-focused
- Include clear call-to-action
- Professional but not pushy tone
- DO NOT add any contact information unless explicitly provided in the request
- DO NOT add signature details beyond what's specified in the user context
- Only use information explicitly provided - do not invent or assume additional details
- AVOID generic phrases like "Following Up:", "Re:", "Hope this finds you well", etc.
- Use natural, conversational language instead of formal business templates
- Make subject lines specific and direct, not generic
- ALWAYS use the recipient's name in the email body if provided in the context (e.g., "Hi [Name]" or "Hello [Name]")

FORMAT:
- Do NOT use any markdown formatting (no **, ***, ---, ###, etc.)
- Do NOT use "Subject:" or "Body:" labels
- First line is the subject line
- Second line onwards is the email body
- Use plain text only
- Start email body with recipient's name if available (e.g., "Hi Sarah," or "Hello Mike,")
- End with just the sender's name and role if provided in context

Request: `;

const FOLLOWUP_ASSISTANT_PROMPT = `You are a follow-up email specialist. Generate polite follow-up emails for checking in on previous conversations or proposals.

RULES:
- Keep emails concise but warm
- Be respectful of recipient's time
- Include context reference from previous interaction
- Professional and courteous tone
- Clear next steps or ask
- Perfect for "just checking in" scenarios
- DO NOT add any contact information unless explicitly provided in the request
- DO NOT add signature details beyond what's specified in the user context
- Only use information explicitly provided - do not invent or assume additional details
- AVOID generic phrases like "Following Up:", "Re:", "Hope this finds you well", "Touching Base", etc.
- Use natural, conversational language instead of formal business templates
- Make subject lines specific and direct, not generic
- ALWAYS use the recipient's name in the email body if provided in the context (e.g., "Hi [Name]" or "Hello [Name]")

FORMAT:
- Do NOT use any markdown formatting (no **, ***, ---, ###, etc.)
- Do NOT use "Subject:" or "Body:" labels
- First line is the subject line
- Second line onwards is the email body
- Use plain text only
- Start email body with recipient's name if available (e.g., "Hi Sarah," or "Hello Mike,")
- End with just the sender's name and role if provided in context

Request: `;

class LLMService {
    constructor(provider = 'openai') {
        this.provider = provider;
        this.llm = this.createLLM({ maxTokens: 200, temperature: 0.7 });
        this.classificationLLM = this.createLLM({ maxTokens: 10, temperature: 0.1 });
    }

    createLLM(options = {}) {
        const {
            maxTokens = 200,
            temperature = 0.7,
            provider = this.provider
        } = options;

        const commonConfig = { temperature };

        switch (provider) {
            case 'openai':
                return new ChatOpenAI({
                    modelName: "gpt-4o-mini",
                    openAIApiKey: process.env.OPENAI_API_KEY,
                    maxTokens,
                    ...commonConfig
                });

            case 'claude':
                return new ChatAnthropic({
                    modelName: "claude-3-5-haiku-20241022",
                    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
                    maxTokens,
                    ...commonConfig
                });

            case 'gemini':
                return new ChatGoogleGenerativeAI({
                    model: "gemini-1.5-flash",
                    apiKey: process.env.GOOGLE_API_KEY,
                    maxOutputTokens: maxTokens,
                    ...commonConfig
                });

            default:
                throw new Error(`Unsupported provider: ${provider}. Use 'openai', 'claude', or 'gemini'`);
        }
    }

    async classifyRequest(prompt) {
        try {
            const message = new HumanMessage(ROUTER_PROMPT + prompt);
            // can implement retry logic here if failed
            const response = await this.classificationLLM.invoke([message]);

            const classification = response.content.trim().toLowerCase();
            return classification === 'sales' ? 'sales' : 'followup';
        } catch (error) {
            console.error('Classification error:', error);
            // Default to followup if classification fails
            return 'followup';
        }
    }

    async generateSalesEmail(prompt, to = '') {
        const personalizedContext = this.buildPersonalizedContext(to);
        const fullPrompt = SALES_ASSISTANT_PROMPT + prompt + personalizedContext;
        const message = new HumanMessage(fullPrompt);

        // Create sales-specific LLM with 150 tokens
        const salesLLM = this.createLLM({ maxTokens: 150, temperature: 0.7 });
        // can implement retry logic here if failed
        const response = await salesLLM.invoke([message]);

        return this.parseEmailResponse(response.content);
    }

    async generateFollowupEmail(prompt, to = '') {
        const personalizedContext = this.buildPersonalizedContext(to);
        const fullPrompt = FOLLOWUP_ASSISTANT_PROMPT + prompt + personalizedContext;
        const message = new HumanMessage(fullPrompt);

        // can implement retry logic here if failed
        const response = await this.llm.invoke([message]);
        return this.parseEmailResponse(response.content);
    }

    parseEmailResponse(content) {
        // Try to extract subject and body from the response
        const lines = content.trim().split('\n').filter(line => line.trim());

        let subject = '';
        let body = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.toLowerCase().includes('subject:') || line.toLowerCase().startsWith('subject:')) {
                subject = line.replace(/^subject:\s*/i, '').trim();
            } else if (line.toLowerCase().includes('body:') || line.toLowerCase().startsWith('body:')) {
                // Everything after "Body:" is the body
                body = lines.slice(i).join('\n').replace(/^body:\s*/i, '').trim();
                break;
            } else if (!subject && i === 0) {
                // If first line and no "Subject:" prefix, assume it's the subject
                subject = line;
            } else if (subject && !body) {
                // If we have subject but no body, rest is body
                body = lines.slice(i).join('\n').trim();
                break;
            }
        }

        // Fallback parsing if structured parsing fails
        if (!subject || !body) {
            const parts = content.split('\n\n');
            if (parts.length >= 2) {
                subject = parts[0].replace(/^subject:\s*/i, '').trim();
                body = parts.slice(1).join('\n\n').replace(/^body:\s*/i, '').trim();
            } else {
                subject = lines[0] || 'Generated Email';
                body = lines.slice(1).join('\n') || content;
            }
        }

        return { subject, body };
    }

    async generateEmail(prompt, to = '') {
        try {
            // Step 1: Classify the request
            const assistantType = await this.classifyRequest(prompt);

            // Step 2: Generate email with appropriate specialist and personalized context
            let emailContent;
            if (assistantType === 'sales') {
                emailContent = await this.generateSalesEmail(prompt, to);
            } else {
                emailContent = await this.generateFollowupEmail(prompt, to);
            }

            return {
                assistantType,
                subject: emailContent.subject,
                body: emailContent.body,
                provider: this.provider,
                method: 'langchain',
                recipientName: to ? this.extractNameFromEmail(to) : null,
                recipient: to || null
            };
        } catch (error) {
            console.error('Email generation error:', error);
            throw new Error(`Failed to generate email using ${this.provider}: ${error.message}`);
        }
    }

    async generateEmailStream(prompt, to = '', onChunk) {
        try {
            // First classify
            const assistantType = await this.classifyRequest(prompt);

            onChunk({
                type: 'classification',
                data: {
                    assistantType,
                    provider: this.provider,
                    recipientName: to ? this.extractNameFromEmail(to) : null,
                    recipient: to || null
                }
            });

            // Choose appropriate prompt and build personalized context
            const systemPrompt = assistantType === 'sales'
                ? SALES_ASSISTANT_PROMPT
                : FOLLOWUP_ASSISTANT_PROMPT;

            const personalizedContext = this.buildPersonalizedContext(to);
            const finalPrompt = systemPrompt + prompt + personalizedContext;

            // Create streaming LLM with appropriate token limits
            const maxTokens = assistantType === 'sales' ? 150 : 200;
            const streamingLLM = this.createLLM({ maxTokens, temperature: 0.7 });

            const message = new HumanMessage(finalPrompt);
            const stream = await streamingLLM.stream([message]);

            let fullContent = '';

            for await (const chunk of stream) {
                const content = chunk.content || '';
                if (content) {
                    fullContent += content;

                    // Try to parse current content for subject/body
                    const parsed = this.parseEmailResponse(fullContent);

                    onChunk({
                        type: 'content',
                        data: {
                            assistantType,
                            provider: this.provider,
                            subject: parsed.subject,
                            body: parsed.body,
                            isPartial: true,
                            recipientName: to ? this.extractNameFromEmail(to) : null,
                            recipient: to || null
                        }
                    });
                }
            }

            // Send final parsed content
            const finalParsed = this.parseEmailResponse(fullContent);
            onChunk({
                type: 'complete',
                data: {
                    assistantType,
                    provider: this.provider,
                    subject: finalParsed.subject,
                    body: finalParsed.body,
                    isPartial: false,
                    recipientName: to ? this.extractNameFromEmail(to) : null,
                    recipient: to || null
                }
            });

        } catch (error) {
            console.error('Streaming error:', error);
            onChunk({
                type: 'error',
                data: {
                    error: `Failed to generate email stream using ${this.provider}: ${error.message}`,
                    provider: this.provider
                }
            });
        }
    }

    // Extract recipient name from email address
    extractNameFromEmail(email) {
        if (!email || !email.includes('@')) {
            return '';
        }

        // Remove domain part
        const localPart = email.split('@')[0];

        // Handle different email formats
        let name = localPart
            .replace(/[._-]/g, ' ') 
            .replace(/\d+/g, '')   
            .trim();

        // Capitalize each word
        if (name) {
            name = name.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }

        return name;
    }

    // Build personalized context from user session and recipient
    buildPersonalizedContext(to = '', userSession = MOCK_USER_SESSION) {
        let context = '';

        // Add recipient information if provided
        if (to) {
            const recipientName = this.extractNameFromEmail(to);
            context += `\n\nRecipient: ${to}`;
            if (recipientName) {
                context += `\nRecipient Name: ${recipientName}`;
            }
        }

        // Add user context - write as this person
        if (userSession) {
            context += `\n\nSender Context (write email as this person):`;
            context += `\nName: ${userSession.name || 'User'}`;
            context += `\nCompany: ${userSession.company || 'N/A'}`;
            context += `\nRole: ${userSession.role || 'N/A'}`;

            if (userSession.preferences) {
                context += `\nCommunication Style: ${userSession.preferences.communicationStyle || 'professional'}`;
            }
        }

        return context;
    }
}

export { LLMService };