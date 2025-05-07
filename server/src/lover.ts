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

export async function putOn(
  llm: LLMProvider,
  girl: Lover,
  boy: Lover,
  startMessage: string,
  onMessage: (message: string, senderName: string) => void
) {
  const messages: LoverMessage[] = [];
  const messageLimit = 300;
  const temperature = 0.25;

  while (messages.length < messageLimit) {
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
      content: responseA.message.content,
      senderName: girl.name,
      role: "assistant",
    });
    flipMessageRoles(messages);
    onMessage(responseA.message.content, girl.name);
    
    const responseB = await llm.chat([
      {
        role: "system",
        content: boy.systemPrompt,
      },
      ...messages as Message[],
    ], { temperature });
    
    messages.push({
      content: responseB.message.content,
      senderName: boy.name,
      role: "user",
    });
    onMessage(responseB.message.content, boy.name);
  }
}

function flipMessageRoles(messages: LoverMessage[]) {
  for (let i = 0; i < messages.length; i++) {
    messages[i].role = messages[i].role === "user" ? "assistant" : "user";
  }
}
