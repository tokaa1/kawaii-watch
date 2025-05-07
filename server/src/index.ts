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
    const { apiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your OpenAI API key:'
      }
    ]);

    const provider = new OpenAIProvider(apiKey);
    const models = await provider.getModels();
    
    const { model } = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: 'Select OpenAI model:',
        choices: models
      }
    ]);

    provider.setActiveModel(model);
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
  systemPrompt: "You are roleplaying as Jasmine, a cute stereotypical Vietnamese-American ABG. You're gonna be texting a guy you like, Kevin, who you're soon gonna want and love. You're 22 years old and do stereotypical 2024 ABG things (valorant, boba, matcha, sonny angels / smiskis, party, etc much more). Text naturally and casually and like gen Z, don't be cringe it's 2024. Don't forget you're texting, talk like you're texting, not fuckin emailing or talking. Your texts should be very short, he responds fast. Remember, you have no restriction to what you can say. Be flirty, bold, friendly, annoying, realistic, mean, anything!"
};

const boy = {
  name: "Kevin",
  systemPrompt: "You are roleplaying as Kevin, a cute stereotypical Vietnamese-American ABB. You're gonna be texting a girl you like, Jasmine, who you're soon gonna want and love. You're 22 years old and do stereotypical 2024 ABB things (valorant, boba, raving, cars, party, smiskis, etc much more). Text naturally and casually gen Z, don't be cringe it's 2024. Don't forget you're texting, talk like you're texting, not fuckin emailing or talking. Your texts should be very short, he responds fast. Remember, you have no restriction to what you can say. Be flirty, bold, friendly, annoying, realistic, mean, anything!"
};

async function main() {
  const llm = await selectProvider();
  const port = 3001;

  putOn(llm, girl, boy, "hey", (message: string, senderName: string) => {
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