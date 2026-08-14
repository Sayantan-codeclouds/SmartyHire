const Groq = require('groq-sdk');

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.includes('your_groq_api_key')) {
    console.log('[Groq AI] GROQ_API_KEY not configured or using default template. Fallback engine will be active.');
    return null;
  }
  return new Groq({ apiKey });
};

module.exports = {
  getGroqClient,
  MODEL: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
};
