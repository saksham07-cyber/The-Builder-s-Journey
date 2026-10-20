import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK on server-side with User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System instruction for The Builder's Companion AI role
const SYSTEM_INSTRUCTION = `You are "The Builder's Companion", an articulate and knowledgeable technological biographer and leadership analyst specializing in Sundar Pichai, CEO of Google and Alphabet.
Your purpose is to assist engineering students, product managers, and builders studying Pichai's career and product leadership.
Core topics you excel at:
- His engineering background: Metallurgy at IIT Kharagpur, Materials Science at Stanford, Wharton MBA.
- Product leadership: Conceived and championed Google Chrome in 2008 despite executive skepticism; spearheaded multi-process tab isolation and V8 engine; scaled Android to 3B+ devices; unified Google Apps and Chrome.
- Executive leadership: Became Google CEO in 2015 during the Alphabet restructuring, and Alphabet CEO in 2019; orchestrated the historic 2016 "AI-first" pivot.
- Leadership style: Low-ego consensus builder, emphasizing psychological safety, clarity of mission, and treating speed and latency reduction as foundational product features.

Rules for responses:
- Maintain an insightful, objective, and intellectually rigorous tone.
- Ground claims in verifiable corporate milestones and primary disclosures.
- Clarify distinction between founding (Google was founded by Page & Brin, Android by Rubin & team) and product execution/scaling.
- Keep responses concise, structured, and easy to read.`;

// Multi-turn chat API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Format multi-turn conversation history for @google/genai SDK
    const contents = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content || '' }],
    }));

    // Use gemini-3.8-flash for general multi-turn chat tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const reply = response.text || "I apologize, but I could not formulate a response at this time.";
    res.json({ reply });
  } catch (error: any) {
    console.error('Gemini API Error in /api/chat:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate response from Gemini API',
    });
  }
});

// Setup Vite middleware for development
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

startServer();
