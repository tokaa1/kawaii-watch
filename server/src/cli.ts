import { OpenAIProvider, OllamaProvider } from "./llm";
import inquirer from 'inquirer';

export async function selectProvider() {
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