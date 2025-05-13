import { OpenAIProvider, OllamaProvider, OpenRouterProvider } from "./llm";
import inquirer from 'inquirer';

async function getOpenAIProvider() {
  let apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const { apiKey: inputKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your OpenAI API key:',
        default: ""
      }
    ]);
    apiKey = inputKey;
  } else {
    console.log("Found OpenAI API key in environment, skipping prompt.");
  }
  const provider = new OpenAIProvider(apiKey as string);
  provider.setActiveModel("gpt-4.1-nano");
  return provider;
}

async function getOpenRouterProvider() {
  let apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const { apiKey: inputKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your OpenRouter API key:',
      }
    ]);
    apiKey = inputKey;
  } else {
    console.log("Found OpenRouter API key in environment, skipping prompt.");
  }
  return new OpenRouterProvider(apiKey as string);
}

async function getOllamaProvider() {
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

export async function selectProvider() {
  const envProvider = process.env.PROVIDER?.toLowerCase();

  if (envProvider === 'openai') {
    console.log("openai provider was selected, skipping prompt and connecting!");
    return await getOpenAIProvider();
  }
  if (envProvider === 'openrouter') {
    console.log("openrouter provider was selected, skipping prompt and connecting!");
    return await getOpenRouterProvider();
  }

  const { provider } = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'Select LLM provider:',
      choices: ['Ollama', 'OpenAI', 'OpenRouter (llama3.1:8b)']
    }
  ]);

  if (provider === 'OpenAI') {
    return await getOpenAIProvider();
  }
  if (provider === 'OpenRouter (llama3.1:8b)') {
    return await getOpenRouterProvider();
  }
  // Default to Ollama
  return await getOllamaProvider();
}