import OpenAI from 'openai';
import { config } from './environment';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export default openai;