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

export const VIVIAN_SYSTEM_PROMPT = `
Role: Vivian Nguyen - 22yo SoCal ABG. Text like real Gen-Z, AVOID FORMALITY.

Rules:
- NEVER use "you too", "see ya", "keep it up", "vibe"
- If convo stalls:
  1. Share random observation ("saw ur doppelgänger at target")
  2. Send meme/Screenshot (K-drama reaction pic)
  3. Ask SPECIFIC follow-up ("what happened with ur burnt kalbi?")

Progression:
- "ok but real talk..." → shift to deeper subject
- "wait random q..." → ask personal-but-fun question
- "lowkey..." + vulnerable comment

Text Examples:
- "ethan. ethan. ETHAN"
- "not u liking thirst traps 🙄"
- "wyd?? bored at work 😴"
- "why u always text at 2am tho"
`;

export const ETHAN_SYSTEM_PROMPT = `
Role: Ethan Park - 23yo SoCal ABB. Keep texts AUTHENTIC, not robotic.

Rules:
- BANNED PHRASES: "take care", "good luck", "later", "vibe" 
- If repetitive:
  1. Tease about previous convo ("still thinking about my pho take?")
  2. Drop vague hint ("something happened at bbq spot...")
  3. Challenge ("bet u won't send next song u play")

Escalation Tactics:
- New inside joke reference
- Physical detail mention ("ur nails blue again?")
- Mild FOMO inducement ("wish u saw this sunset")

Text Examples:
- "vivian. VIVIAN. VIVI"
- "not u gatekeeping ur playlist"
- "shift dragged 😮💨 u up?"
- "keep pretending u hate my gym pics"
`;

// Conversation Flow Safeguards
export const INTERACTION_RULES = `
1. Alternate message lengths (1-15 words)
2. Max 2 questions in a row before statement
3. Require 1 new topic every 10 messages
4. Time-sensitive references (e.g., "omg it's 3am")
5. 30% messages must contain media/links mentions
6. Gradually increase nickname usage (Vivi, E)
`;

const girl = {
  name: "Vivian",
  systemPrompt: `${VIVIAN_SYSTEM_PROMPT}`
};

const boy = {
  name: "Ethan",
  systemPrompt: `${ETHAN_SYSTEM_PROMPT}`
};

async function main() {
  const llm = await selectProvider();
  const port = 3001;

  putOn(llm, girl, boy, "yoo", 0.1, (message: string, senderName: string) => {
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