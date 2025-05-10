import { Message, LLMProvider } from "./llm";
import { Lover } from "./lovers";

export type LoverMessage = {
  content: string;
  senderName: string;
  role: "user" | "assistant";
}

export class LoveController {
  private _stopped = false;
  stop() {
    this._stopped = true;
  }
  get stopped() {
    return this._stopped;
  }
}

export type SimulateLoveParams = {
  llm: LLMProvider;
  girl: Lover;
  boy: Lover;
  startMessage: string;
  temperature?: number;
  onMessage: (message: string, senderName: string) => void;
  controller?: LoveController;
};

export async function simulateLove(params: SimulateLoveParams) {
  const {
    llm,
    girl,
    boy,
    startMessage,
    temperature = 0.4,
    onMessage,
    controller
  } = params;

  const messages: LoverMessage[] = [];
  const messageLimit = 300;

  onMessage(startMessage, boy.name);

  let responseStart = Date.now();

  while (messages.length < messageLimit) {
    if (controller?.stopped) break;

    responseStart = Date.now();
    const responseA = await llm.chat([
      {
        role: "system",
        content: girl.systemPrompt,
      },
      {
        content: startMessage,
        role: "user",
      },
      ...messages as Message[],
    ], { temperature });

    if (controller?.stopped) break;

    messages.push({
      content: responseA,
      senderName: girl.name,
      role: "assistant",
    });
    flipMessageRoles(messages);
    const aWordCount = getWordCount(responseA);
    const aSleepTime = getRandomWaitTimeMs(aWordCount);
    await sleep(Math.max(0, aSleepTime - (Date.now() - responseStart)));
    onMessage(responseA, girl.name);

    if (controller?.stopped) break;

    responseStart = Date.now();

    const responseB = await llm.chat([
      {
        role: "system",
        content: boy.systemPrompt,
      },
      ...messages as Message[],
    ], { temperature });

    if (controller?.stopped) break;

    messages.push({
      content: responseB,
      senderName: boy.name,
      role: "user",
    });
    const bWordCount = getWordCount(responseB);
    const bSleepTime = getRandomWaitTimeMs(bWordCount);
    await sleep(Math.max(0, bSleepTime - (Date.now() - responseStart)));
    onMessage(responseB, boy.name);
  }
}

function getWordCount(text: string) {
  return text.split(" ").length;
}

function flipMessageRoles(messages: LoverMessage[]) {
  for (let i = 0; i < messages.length; i++) {
    messages[i].role = messages[i].role === "user" ? "assistant" : "user";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function getRandomWaitTimeMs(wordCount: number) {
  return Math.min(random(wordCount * 40, wordCount * 50), 2000);
}