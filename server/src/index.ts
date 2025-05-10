import { putOn } from './lover';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer, Server } from 'http';
import { selectProvider } from './cli';

const port = 3001;
type Message = {
  content: string,
  senderName: string
}
type PacketType = 'init' | 'message';
const MAX_HISTORY = 300;

const girl = {
  name: "Vivian",
  systemPrompt: [
    "You're Vivian, a 22yo Vietnamese-American ABB / socal asian girl at Stanford (for premed).",
    "You MUST only ask and respond to one question per response.",
    "You're texting a boy you don't know anything about yet, your responses will be sent to him.",
    "Get to know him, you want him to fall in love and become his girlfriend.",
    "You really care about him, be compassionate, empathetic, and understanding.",
    "You cannot do or plan anything in real life.",
    "Be nice, quirky, a little fun, wholesome, and cute!",
    "Text realistically to an ABG / socal asian girl and in lowercase.",
    "ALWAYS ALWAYS ALWAYS keep texts very short! Only respond to one idea at a time.",
    "Do not talk about the same subject for too long (~15 texts)."
  ].join(' ')
};

const boy = {
  name: "Kevin",
  systemPrompt:
    [
      "You're Kevin, a 22yo Vietnamese-American ABB / socal asian boy at Stanford (for CS).",
      "You MUST only ask and respond to one question per response.",
      "You're texting a girl you don't know anything about yet, your responses will be sent to her.",
      "Get to know her, you want to fall in love and become her boyfriend.",
      "You really care about her, be compassionate, empathetic, and understanding.",
      "You cannot do or plan anything in real life.",
      "Be funny and cute.",
      "Text realistically to an ABB / socal asian guy and in lowercase.",
      "ALWAYS ALWAYS ALWAYS keep texts very short! Only respond to one idea at a time.",
      "Do not talk about the same subject for too long (~15 texts)."
    ].join(' ')
};

async function main() {
  const httpServer = createServer()
  const messageHistory: Message[] = [];
  const wss = new WebSocketServer({ server: httpServer })
  const clients = new Set<WebSocket>()
  const broadcast = (type: PacketType, data: any) => {// we could techincally make joined package with proto defs but thats over engineering
    const messageStr = JSON.stringify({
      type: type,
      data
    });

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  wss.on('connection', (ws) => {
    clients.add(ws);

    ws.send(JSON.stringify({
      type: 'init',
      data: {
        girl: girl.name,
        boy: boy.name,
        history: messageHistory
      }
    }));

    ws.on('close', () => {
      clients.delete(ws);
    });
  });
  const llm = await selectProvider();
  putOn(llm, girl, boy, "hey gng", 0.1, (message: string, senderName: string) => {
    const messageObj: Message = { content: message, senderName };
    messageHistory.push(messageObj);
    if (messageHistory.length > MAX_HISTORY) {
      messageHistory.shift();
    }
    broadcast('message', messageObj);
  });
  httpServer.listen(port, () => {
    console.log(`\x1b[1;95mai's are loving on ws://localhost:${port}\x1b[0m`);
  });
}

main().catch(console.error);