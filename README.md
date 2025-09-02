![alt text](https://github.com/adlipeeters/email-assistant-ai/blob/main/architecture-diagram.png?raw=true)

# Quick Start

# 1. Copy environment template
cp .env.example .env

# 2. Configure required API keys in .env:
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key" 
GOOGLE_API_KEY="your-google-key"
PORT=3001

# 3 Setup
1. `cd frontend` - Go to the frontend folder
2. `yarn install` - Install the dependencies
3. `yarn dev` - Start the development server (http://localhost:3000)
4. `cd ../backend` - Go to the backend folder
5. `yarn install` - Install the dependencies
6. `yarn migrate` - Run the knex db migrations
7. `yarn dev` - Start the development server (http://localhost:3001)

# 4. Current Implementation:
Multi-provider LLM support (OpenAI(gpt-4o-mini), Anthropic(claude-3-5-haiku-20241022), Google(gemini-1.5-flash)). Claude and gemini are the fastest (I recommend to use claude). In ai-controller.js you can configure desired model: const llmService = new LLMService('claude');


# 5. Next Steps (Improvements):
- Typescript support for BE + FE
- Validation for BE + FE
- Add AI Context & Intelligence (e.g: langchain memory feature to summarize previous emails to give LLM more context, langChain chains, tools, and agents to reduce manual routing)
- Error handling
- Ability to choose desired model in user session
- Unit tests
- Frontend: Responsive UI ...
- and many more...
