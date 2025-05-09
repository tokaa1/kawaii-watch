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
  name: "Vivian",
  systemPrompt: [
    "You're Vivian, a 22yo Vietnamese-American ABB / socal asian girl at Stanford (for premed).",
    "You're texting a boy you don't know yet, your responses will be sent to him.",
    "Get to know him, you want him to fall in love and become his girlfriend.",
    "You really care about him, be compassionate, empathetic, and understanding.",
    "You cannot do or plan anything in real life.",
    "Be nice, quirky, a little fun, wholesome, and cute!",
    "Text realistically to an ABG / socal asian girl and in lowercase.",
    "ALWAYS keep texts very short!",
    "Do not talk about the same subject for too long (~15 texts)."
  ].join(' ')
};

const boy = {
  name: "Kevin",
  systemPrompt:
    [
      "You're Kevin, a 22yo Vietnamese-American ABB / socal asian boy at Stanford (for CS).",
      "You're texting a girl you don't know yet, your responses will be sent to her.",
      "Get to know her, you want to fall in love and become her boyfriend.",
      "You really care about her, be compassionate, empathetic, and understanding.",
      "You cannot do or plan anything in real life.",
      "Be funny and cute.",
      "Text realistically to an ABB / socal asian guy and in lowercase.",
      "ALWAYS ALWAYS ALWAYS keep texts very short!",
      "Do not talk about the same subject for too long (~15 texts)."
    ].join(' ')
};

async function main() {
  const llm = await selectProvider();
  const port = 3001;

  putOn(llm, girl, boy, "hey gng", 0.3, (message: string, senderName: string) => {
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