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
    return response.models.map((model: any) => model.name);
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
    return models.data.map((model: any) => model.id);
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

// OpenRouterProvider uses OpenAI client but always uses llama3.2:3b via OpenRouter API
export class OpenRouterProvider implements LLMProvider {
  private client: OpenAI;
  private readonly model: string = "meta-llama/llama-3.1-8b-instruct";

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        'HTTP-Referer': 'https://kawaii-watch.nightly.pw',
        'X-Title': 'kawaii-watch'
      }
    });
  }

  async getModels(): Promise<string[]> {
    return [this.model];
  }

  setActiveModel(_model: string): void {

  }

  async chat(messages: Message[], options?: { temperature?: number }) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: options?.temperature ?? 1.0
      });
      return response.choices[0].message.content || "";
    } catch (error) {
      console.error("Error calling OpenRouter API:", error);
      throw error;
    }
  }
}