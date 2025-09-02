Quick Start

# 1. Copy environment template
cp .env.example .env

# 2. Configure required API keys in .env:
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key" 
GOOGLE_API_KEY="your-google-key"
PORT=3001

# 3. Current Implementation:
Multi-provider LLM support (OpenAI(gpt-4o-mini), Anthropic(claude-3-5-haiku-20241022), Google(gemini-1.5-flash)). Claude and gemini are the fastest (I recommend to use claude). In ai-controller.js you can configure desired model: const llmService = new LLMService('claude');

# 4. Next Steps:
- Typescript support for BE + FE
- Validation for BE + FE
- Add AI Context & Intelligence (e.g: langchain memory feature to summarize previous emails to give LLM more context, langChain chains, tools, and agents to reduce manual routing)
- Error handling
- Ability to choose desired model in user session
- Unit tests
- Frontend: Responsive UI ...
- and many more...