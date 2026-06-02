const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('WARNING: GEMINI_API_KEY environment variable is not set.');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

// Export reusable model instance for gemini-2.5-flash with JSON mode enabled
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json'
  }
});

module.exports = {
  genAI,
  model
};
