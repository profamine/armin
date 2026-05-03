import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ override: true });

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
        // AI has been removed at the user's request
        res.json({ text: "L'IA a été désactivée conformément à votre demande. (AI disabled)" });
      } catch (err) {
        console.error('Chat API Error:', err);
        res.status(400).json({ error: extractErrorMessage(err) });
      }
    }
  );

  // ── Route /api/tts (Google Translate Fallback, NO AI) ───────────────────
  app.get('/api/tts', async (req: Request, res: Response): Promise<void> => {
    try {
      const { text, lang } = req.query;
      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: '`text` is required.' });
        return;
      }

      const ttsLang = lang === 'ar' ? 'ar' : (lang === 'hy' ? 'hy' : 'ar');
      const url = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=${ttsLang}&q=${encodeURIComponent(text)}`;

      const fetchRes = await fetch(url);
      if (!fetchRes.ok) {
        throw new Error(`Google TTS request failed with status: ${fetchRes.status}`);
      }

      res.set('Content-Type', 'audio/mpeg');
      res.set('Cache-Control', 'public, max-age=3600');
      
      const buffer = await fetchRes.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (err) {
      console.error('TTS API Error:', err);
      res.status(400).json({ error: String(err) });
    }
  });

  // ── Route /api/transcribe ────────────────────────────────────────────────
  // STT endpoint. Excepts { audioData: "base64...", mimeType: "audio/webm" }
  app.post('/api/transcribe', async (req: Request, res: Response): Promise<void> => {
    try {
      const { audioData } = req.body;
      if (!audioData) {
        res.status(400).json({ error: 'audioData is required' });
        return;
      }

      // AI transcription has been removed at the user's request
      res.json({ text: "L'IA de transcription a été désactivée. (Transcription disabled)" });
    } catch (err) {
      console.error('STT API Error:', err);
      res.status(400).json({ error: extractErrorMessage(err) });
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