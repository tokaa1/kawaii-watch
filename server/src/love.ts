import { Message, LLMProvider } from "./llm";
import { Lover } from "./lovers";
import { randomInt, sleep } from "./util";

export type LoverMessage = {
  content: string;
  senderName: string;
  role: "user" | "assistant";
}

export type StarterMessage = {
  message: string;
  role: "boy" | "girl";
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
  startMessage: StarterMessage;
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
  onMessage(startMessage.message, startMessage.role === "boy" ? boy.name : girl.name);
  messages.push({
    content: startMessage.message,
    senderName: startMessage.role === "boy" ? boy.name : girl.name,
    role: "user",
  });

  const personA = startMessage.role === "boy" ? girl : boy;
  const personB = startMessage.role === "boy" ? boy : girl;

  let responseStart = Date.now();
  while (!controller?.stopped) {
    if (controller?.stopped) break;

    responseStart = Date.now();
    const responseA = cleanUpResponse(await llm.chat([
      {
        role: "system",
        content: personA.systemPrompt,
      },
      ...messages as Message[],
    ], { temperature }));

    if (controller?.stopped) break;

    messages.push({
      content: responseA,
      senderName: personA.name,
      role: "assistant",
    });
    flipMessageRoles(messages);
    const aWordCount = getWordCount(responseA);
    const aSleepTime = getRandomWaitTimeMs(aWordCount);
    await sleep(Math.max(0, aSleepTime - (Date.now() - responseStart)));
    onMessage(responseA, personA.name);

    if (controller?.stopped) break;

    responseStart = Date.now();

    const responseB = cleanUpResponse(await llm.chat([
      {
        role: "system",
        content: personB.systemPrompt,
      },
      ...messages as Message[],
    ], { temperature }));

    if (controller?.stopped) break;

    messages.push({
      content: responseB,
      senderName: personB.name,
      role: "user",
    });
    const bWordCount = getWordCount(responseB);
    const bSleepTime = getRandomWaitTimeMs(bWordCount);
    await sleep(Math.max(0, bSleepTime - (Date.now() - responseStart)));
    onMessage(responseB, personB.name);
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

function getRandomWaitTimeMs(wordCount: number) {
  const wpm = 300;// reading speed
  const msPerWord = 60_000 / wpm // 300 wpm
  return Math.max(800, Math.min(Math.round(wordCount * msPerWord), 2000));
}

// we currently just only return the first line of response
// llm likes to get in a pattern of many multiple lines
function cleanUpResponse(text: string) {
  return text.replace(/\n/g, ' ').trim();
}