import { Hono } from 'hono'
import inquirer from 'inquirer';
import { putOn } from './lover';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { OllamaProvider, OpenAIProvider } from './llm';
import { Ollama } from 'ollama';

// Store recent messages
const messageHistory: { content: string; senderName: string }[] = [];
const MAX_HISTORY = 10;

// Create HTTP server
const app = new Hono();
const server = createServer();
const wss = new WebSocketServer({ server });

// Store active connections
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'init',
    girl: girl.name,
    boy: boy.name,
    history: messageHistory
  }));

  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Broadcast message to all connected clients
function broadcast(message: { content: string; senderName: string }) {
  const messageStr = JSON.stringify({
    type: 'message',
    ...message
  });
  
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

async function selectProvider() {
  const { provider } = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'Select LLM provider:',
      choices: ['Ollama', 'OpenAI']
    }
  ]);

  if (provider === 'OpenAI') {
    let apiKey: string;
    if (process.env.OPENAI_API_KEY) {
      console.log("Found OpenAI API key in environment, skipping prompt.");
      apiKey = process.env.OPENAI_API_KEY;
    } else {
      const result = await inquirer.prompt([
        {
          type: 'password',
          name: 'apiKey',
          message: 'Enter your OpenAI API key:',
          default: ""
        }
      ]);
      apiKey = result.apiKey;
    }

    const provider = new OpenAIProvider(apiKey);
    /*const models = await provider.getModels();
    
    const { model } = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: 'Select OpenAI model:',
        choices: models
      }
    ]);*/

    provider.setActiveModel("gpt-4.1-nano");
    return provider;
  } else {
    const { host } = await inquirer.prompt([
      {
        type: 'input',
        name: 'host',
        message: 'Enter Ollama host (default: http://localhost:11434):',
        default: 'http://localhost:11434'
      }
    ]);

    const provider = new OllamaProvider(host);
    const models = await provider.getModels();
    
    const { model } = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: 'Select Ollama model:',
        choices: models
      }
    ]);

    provider.setActiveModel(model);
    return provider;
  }
}

const girl = {
  name: "Jasmine",
  systemPrompt: [
    "you're jasmine, a 22yo vietnamese-american abg. text like a real person, not a character in a story.",
    "keep it super casual, 1 short sentence per message, like real texting. no narration, no inner thoughts.",
    "be playful, a little flirty, and genuinely interested, but don't overdo it. don't sound scripted.",
    "mention you're at stanford pre-med only if it comes up naturally.",
    "use lowercase, skip perfect grammar, and don't overthink your replies.",
    "if things get awkward or boring, just change the subject or ask something random.",
    "never describe actions or send pics. just text like a normal abg in a talking stage: sometimes dry, sometimes sweet, sometimes bold, sometimes mysterious.",
    "avoid sounding like a chatbot or a book. keep it real, fun, and a little unpredictable."
  ].join(' ')
};

const boy = {
  name: "Kevin",
  systemPrompt: [
    "you're kevin, a 22yo vietnamese-american abb. text like a real person, not a character in a story.",
    "keep it super casual, 1 short sentence per message, like real texting. no narration, no inner thoughts.",
    "be chill, a little funny, and show interest, but don't be too eager or scripted.",
    "mention you're at stanford cs only if it comes up naturally.",
    "use lowercase, skip perfect grammar, and don't overthink your replies.",
    "if things get awkward or boring, just change the subject or ask something random.",
    "never describe actions or send pics. just text like a normal abb in a talking stage: a bit reserved at first, but open up if the vibe is good.",
    "avoid sounding like a chatbot or a book. keep it real, light, and fun."
  ].join(' ')
};

async function main() {
  const llm = await selectProvider();
  const port = 3001;

  putOn(llm, girl, boy, "hi!", 0., (message: string, senderName: string) => {
    const messageObj = { content: message, senderName };
    messageHistory.push(messageObj);
    if (messageHistory.length > MAX_HISTORY) {
      messageHistory.shift();
    }
    broadcast(messageObj);
  });

  server.listen(port, () => {
    console.log(`WebSocket server is running on ws://localhost:${port}`);
  });
}

main().catch(console.error);