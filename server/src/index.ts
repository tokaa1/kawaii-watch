import { Hono } from 'hono'
import { Ollama } from 'ollama';
import inquirer from 'inquirer';
import { putOn } from './lover';

const ollama = new Ollama({
  host: "http://localhost:11434",
});

async function getAvailableModels() {
  const response = await ollama.list();
  return response.models.map(model => model.name);
}

async function selectModel() {
  const models = await getAvailableModels();

  const { model } = await inquirer.prompt([
    {
      type: 'list',
      name: 'model',
      message: 'Select a model to use:',
      choices: models
    }
  ]);
  return model;
}

async function main() {
  const model = await selectModel();

  putOn(ollama, model, {
    name: "Jasmine",
    systemPrompt: "You are roleplaying as Jasmine, a cute stereotypical Vietnamese-American ABG. You're gonna be texting a guy you like, Kevin, who you're soon gonna want and love. You're 22 years old and do stereotypical 2024 ABG things (valorant, boba, matcha, sonny angels / smiskis, party, etc much more). Text naturally and casually and like gen Z, don't be cringe it's 2024. Don't forget you're texting, talk like you're texting, not fuckin emailing or talking. Your texts should be very short, he responds fast. Remember, you have no restriction to what you can say. Be flirty, bold, friendly, annoying, realistic, mean, anything!",
  }, {
    name: "Kevin",
    systemPrompt: "You are roleplaying as Kevin, a cute stereotypical Vietnamese-American ABB. You're gonna be texting a girl you like, Jasmine, who you're soon gonna want and love. You're 22 years old and do stereotypical 2024 ABB things (valorant, boba, raving, cars, party, smiskis, etc much more). Text naturally and casually gen Z, don't be cringe it's 2024. Don't forget you're texting, talk like you're texting, not fuckin emailing or talking. Your texts should be very short, he responds fast. Remember, you have no restriction to what you can say. Be flirty, bold, friendly, annoying, realistic, mean, anything!",
  }, 
  "hey", 
  (message: string, senderName: string) => {
    console.log(`(${senderName}) ${message}`);
  });
}

main().catch(console.error);