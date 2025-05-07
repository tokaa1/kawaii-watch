import { Ollama } from 'ollama';
import OpenAI from 'openai';

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMProvider {
  chat(messages: Message[], options?: { temperature?: number }): Promise<string>;
  getModels(): Promise<string[]>;
  setActiveModel(model: string): void;
}

export class OllamaProvider implements LLMProvider {
  private client: Ollama;
  private activeModel?: string;

  constructor(host: string = "http://localhost:11434") {
    this.client = new Ollama({ host });
  }

  async getModels(): Promise<string[]> {
    const response = await this.client.list();
    return response.models.map(model => model.name);
  }

  setActiveModel(model: string): void {
    this.activeModel = model;
  }

  async chat(messages: Message[], options?: { temperature?: number }) {
    if (!this.activeModel) {
      throw new Error("No active model");
    }
    const response = await this.client.chat({
      model: this.activeModel,
      messages,
      options: {
        temperature: options?.temperature ?? 1.0
      }
    });
    return response.message.content || "";
  }
}

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private activeModel?: string;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async getModels(): Promise<string[]> {
    const models = await this.client.models.list({});
    return models.data.map(model => model.id);
  }

  setActiveModel(model: string): void {
    this.activeModel = model;
  }

  async chat(messages: Message[], options?: { temperature?: number }) {
    if (!this.activeModel) {
      throw new Error("No active model");
    }
    const response = await this.client.chat.completions.create({
      model: this.activeModel,
      messages,
      temperature: options?.temperature ?? 1.0
    });

    return response.choices[0].message.content || "";
  }
} 