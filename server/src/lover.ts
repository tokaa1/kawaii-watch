import { Message, LLMProvider } from "./llm";

export type Lover = {
  systemPrompt: string;
  name: string;
}

export type LoverMessage = {
  content: string;
  senderName: string;
  role: "user" | "assistant";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export async function putOn(
  llm: LLMProvider,
  girl: Lover,
  boy: Lover,
  startMessage: string,
  onMessage: (message: string, senderName: string) => void
) {
  const messages: LoverMessage[] = [];
  const messageLimit = 300;
  const temperature = 0.4;

  onMessage(startMessage, boy.name);

  let responseStart = Date.now();

  while (messages.length < messageLimit) {
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
    
    messages.push({
      content: responseA,
      senderName: girl.name,
      role: "assistant",
    });
    flipMessageRoles(messages);
    const aWordCount = getWordCount(responseA);
    await sleep(Math.max(0, Date.now() - responseStart + random(aWordCount * 25, aWordCount * 50)));
    onMessage(responseA, girl.name);
    responseStart = Date.now();
    
    const responseB = await llm.chat([
      {
        role: "system",
        content: boy.systemPrompt,
      },
      ...messages as Message[],
    ], { temperature });
    
    messages.push({
      content: responseB,
      senderName: boy.name,
      role: "user",
    });
    const bWordCount = getWordCount(responseB);
    await sleep(Math.max(0, Date.now() - responseStart + random(bWordCount * 25, bWordCount * 50)));
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
