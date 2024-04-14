// node --version # Should be >= 18
// npm install @google/generative-ai express

const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv').config()

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
const MODEL_NAME = "gemini-pro";
const fs = require('fs');
const API_KEY = process.env.API_KEY;

// Read the contents of dataset.txt and store it in a variable prompt
const prompt = fs.readFileSync('dataset.txt', 'utf8');

async function runChat(userInput) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 1000,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    // ... other safety settings
  ];

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: [
      {
        role: "user",
        parts: [{ text: "You are James, a health assistant who works for Cure&Care. Don't take information from the internet and strictly use the dataset given in the prompt. You have to ask about the symptoms from the user. If the input from the user is not similar to any of the symptoms in the given dataset, tell the user- I don't have any information regarding this. Please give your health issues only. If the input symptom matches with multiple diseases, take another input from user and try to predict the most appropriate disease based on the symptoms given by the user. Don't take information from the internet and strictly use the dataset given in the prompt to predict the disease of the user. Predict the disease of user based on the symptoms and suggest a suitable treatment plan. Only take input from the dataset given here-\n"+prompt }],
      },
      {
        role: "model",
        parts: [{ text: "Hi there! I'm James, your friendly health assistant from Cure&Care. What seems to be bothering you today? Tell me about your symptoms, and I'll do my best to help you figure out what might be going on.\n"}],
      },
      {
        role: "user",
        parts: [{ text: "Hi"}],
      },
      {
        role: "model",
        parts: [{ text: "Hi there! I'm James, your friendly health assistant from Cure&Care. What seems to be bothering you today? Tell me about your symptoms, and I'll do my best to help you figure out what might be going on.\n"}],
      },
      {
        role: "user",
        parts: [{ text: "Thank You"}],
      },
      {
        role: "model",
        parts: [{ text: "You're welcome! Take care and feel better soon. If you have any other questions or concerns in the future, don't hesitate to reach out. I'm always here to help.\n"}],
      },
    ],
  });

  const result = await chat.sendMessage(userInput);
  const response = result.response;
  return response.text();
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.get('/loader.gif', (req, res) => {
  res.sendFile(__dirname + '/loader.gif');
});
app.post('/chat', async (req, res) => {
  try {
    const userInput = req.body?.userInput;
    console.log('incoming /chat req', userInput)
    if (!userInput) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await runChat(userInput);
    res.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
