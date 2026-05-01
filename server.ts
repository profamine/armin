import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// ─── Validation de la config au démarrage ────────────────────────────────────
function createGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// ─── Helper : extraire le message d'erreur ───────────────────────────────────
function extractErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return 'Une erreur inconnue est survenue.';
  return err.message || 'Une erreur inconnue est survenue.';
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface ChatRequestBody {
  contents: ChatMessage[];
  systemInstruction?: string;
}

// ─── Encode raw PCM to WAV ──────────────────────────────────────────────────
function encodeWAV(pcmBytes: Buffer, sampleRate = 24000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  
  const buffer = Buffer.alloc(44 + pcmBytes.length);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + pcmBytes.length, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); 
  buffer.writeUInt16LE(1, 20); 
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(pcmBytes.length, 40);
  pcmBytes.copy(buffer, 44);
  return buffer;
}

// ─── Serveur principal ───────────────────────────────────────────────────────
async function startServer(): Promise<void> {
  const app = express();
  const PORT = 3000;
  const IS_PROD = process.env.NODE_ENV === 'production';
  const ai = createGenAIClient();

  app.use(express.json({ limit: '10mb' }));

  // ── Validation basique du body ──────────────────────────────────────────
  function validateChatBody(
    req: Request<{}, {}, ChatRequestBody>,
    res: Response,
    next: NextFunction
  ): void {
    if (!req.body?.contents || !Array.isArray(req.body.contents)) {
      res.status(400).json({ error: '`contents` est requis et doit être un tableau.' });
      return;
    }
    next();
  }

  // ── Route /api/chat ─────────────────────────────────────────────────────
  app.post(
    '/api/chat',
    validateChatBody,
    async (req: Request<{}, {}, ChatRequestBody>, res: Response): Promise<void> => {
      try {
        const { contents, systemInstruction } = req.body;
        
        // Map messages
        const formattedContents = contents.map(m => ({
          role: m.role,
          parts: m.parts.map(p => ({ text: p.text }))
        }));

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: formattedContents,
          config: systemInstruction ? { systemInstruction } : undefined
        });

        res.json({ text: response.text });
      } catch (err) {
        console.error('Chat API Error:', err);
        res.status(500).json({ error: extractErrorMessage(err) });
      }
    }
  );

  // ── Route /api/tts ──────────────────────────────────────────────────────
  app.get('/api/tts', async (req: Request, res: Response): Promise<void> => {
    try {
      const { text } = req.query;
      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: '`text` is required.' });
        return;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error('No audio generated from TTS model');
      }

      const pcmBytes = Buffer.from(base64Audio, 'base64');
      const wavBuffer = encodeWAV(pcmBytes, 24000);

      res.set('Content-Type', 'audio/wav');
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(wavBuffer);
    } catch (err) {
      console.error('TTS API Error:', err);
      res.status(500).json({ error: String(err) });
    }
  });

  // ── Route /api/transcribe ────────────────────────────────────────────────
  // STT endpoint. Excepts { audioData: "base64...", mimeType: "audio/webm" }
  app.post('/api/transcribe', async (req: Request, res: Response): Promise<void> => {
    try {
      const { audioData, mimeType, expectedLanguage } = req.body;
      if (!audioData) {
        res.status(400).json({ error: 'audioData is required' });
        return;
      }

      let prompt = 'Please carefully transcribe this audio.';
      if (expectedLanguage) {
        prompt += ` The expected language is ${expectedLanguage}. Only output the exact transcription text, with no extra formatting, markdown, or conversational filler.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { data: audioData, mimeType: mimeType || 'audio/webm' } }
            ]
          }
        ]
      });

      res.json({ text: (response.text || "").trim() });
    } catch (err) {
      console.error('STT API Error:', err);
      res.status(500).json({ error: extractErrorMessage(err) });
    }
  });

  // ── Middleware Vite (dev) ou fichiers statiques (prod) ──────────────────
  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));

    app.get(/^(?!\/api).*/, (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // ── Démarrage ───────────────────────────────────────────────────────────
  app.listen(PORT, '0.0.0.0', () => {
    const env = IS_PROD ? 'production' : 'développement';
    const model = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';
    console.log(`✅ Serveur ${env} démarré → http://localhost:${PORT}`);
    console.log(`🤖 Modèle Groq : ${model}`);
  });
}

startServer().catch((err) => {
  console.error('❌ Erreur fatale au démarrage :', err);
  process.exit(1);
});