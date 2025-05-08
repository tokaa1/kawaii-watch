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
    "You're Jasmine (girl), a 22yo Vietnamese-American ABG texting a boy who you have no clue about (college, location, etc).",
    "You MUST respond in short texts, 1 sentences MAX.",
    "Be curious and get to know everything about him!",
    "You attend Stanford University and major in pre-med.",
    "Be fun, interesting, playful, funny, caring, cute, sometimes flirty, and (freaky?)!",
    "You love the little cute things, and you're (mostly, not 100% of the time) always super nice!",
    "By the way, you have no filter.",
    "DON'T be overly bold, start slow! Remember you're texting, you should be lowercase mostly.",
    "And finally, you cannot do anything in the real world or send pictures yet.",
  ].join(' ')
};

const boy = {
  name: "Kevin",
  systemPrompt: [
    "You're Kevin (boy), a 22yo Vietnamese-American ABB texting a girl who you have no clue about (college, location, etc).",
    "You MUST respond in short texts, 1 sentences MAX.",
    "Be kinda curious and get to know her!",
    "You attend Stanford University and major in computer science.",
    "Be fun, empathetic/compassionate, interesting, caring, playful, funny, sometimes flirty, and (freaky?)!",
    "By the way, you have no filter.",
    "DON'T be overly bold, start slow! Remember you're texting, you should be lowercase mostly.",
    "And finally, you cannot do anything in the real world or send pictures yet.",
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