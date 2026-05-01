import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// ─── Validation de la config au démarrage ────────────────────────────────────
const REQUIRED_ENV = ['GROQ_API_KEY'] as const;

function validateEnv(): void {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Variables d'environnement manquantes : ${missing.join(', ')}`);
    process.exit(1);
  }
}

// ─── Instance Groq unique (singleton) ────────────────────────────────────────
function createGroqClient(): Groq {
  return new Groq({ apiKey: process.env.GROQ_API_KEY! });
}

// ─── Helper : extraire le message d'erreur ───────────────────────────────────
function extractErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return 'Une erreur inconnue est survenue.';
  try {
    const parsed = JSON.parse(err.message);
    return parsed?.error?.message ?? err.message;
  } catch {
    return err.message;
  }
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

// ─── Convertir le format Gemini → format OpenAI/Groq ─────────────────────────
function toGroqMessages(
  contents: ChatMessage[],
  systemInstruction?: string
): Groq.Chat.ChatCompletionMessageParam[] {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [];

  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }

  for (const msg of contents) {
    messages.push({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.parts.map((p) => p.text).join(''),
    });
  }

  return messages;
}

// ─── Serveur principal ───────────────────────────────────────────────────────
async function startServer(): Promise<void> {
  validateEnv();

  const app = express();
  const PORT = 3000;
  const IS_PROD = process.env.NODE_ENV === 'production';
  const groq = createGroqClient();

  app.use(express.json({ limit: '1mb' }));

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

        const completion = await groq.chat.completions.create({
          model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
          messages: toGroqMessages(contents, systemInstruction),
          temperature: 0.7,
          max_tokens: 2048,
        });

        const text = completion.choices[0]?.message?.content ?? '';
        res.json({ text });
      } catch (err) {
        console.error('Chat API Error:', err);
        res.status(500).json({ error: extractErrorMessage(err) });
      }
    }
  );

  // ── Route /api/tts ──────────────────────────────────────────────────────
  // ✅ Groq PlayAI TTS — voix arabe native (Nadia-PlayAI)
  app.get('/api/tts', async (req: Request, res: Response): Promise<void> => {
    try {
      const { text } = req.query;
      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: '`text` is required.' });
        return;
      }

      const ttsResponse = await groq.audio.speech.create({
        model: 'playai-tts-arabic',
        voice: 'Nadia-PlayAI',
        input: text,
        response_format: 'mp3',
      });

      const buffer = Buffer.from(await ttsResponse.arrayBuffer());
      res.set('Content-Type', 'audio/mpeg');
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(buffer);
    } catch (err) {
      console.error('TTS API Error:', err);
      res.status(500).json({ error: String(err) });
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