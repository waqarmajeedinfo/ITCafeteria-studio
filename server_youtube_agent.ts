import type { Express, Request, Response } from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data', 'youtube-agent');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');

export type YouTubeAgentStage =
  | 'researching'
  | 'draft_ready'
  | 'media_pending'
  | 'approval_pending'
  | 'approved'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'cancelled';

interface YouTubeAgentJob {
  id: string;
  channelId: string;
  topic: string;
  title: string;
  description: string;
  tags: string[];
  sources: Array<{ title: string; url: string; retrievedAt: string }>;
  stage: YouTubeAgentStage;
  dryRun: boolean;
  approvalRequired: true;
  approvedAt?: string;
  scheduledAt?: string;
  videoPath?: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

async function readJobs(): Promise<YouTubeAgentJob[]> {
  try {
    const jobs = JSON.parse(await fs.readFile(JOBS_FILE, 'utf8'));
    return Array.isArray(jobs) ? jobs : [];
  } catch (error: any) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeJobs(jobs: YouTubeAgentJob[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${JOBS_FILE}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(jobs, null, 2), { mode: 0o600 });
  await fs.rename(tmp, JOBS_FILE);
}

function sendError(res: Response, status: number, error: string) {
  return res.status(status).json({ ok: false, error });
}

function validateAdmin(req: Request, res: Response): boolean {
  const accessKey = process.env.APP_ACCESS_KEY || '';
  if (!accessKey) return true;
  const authorization = req.headers.authorization || '';
  const [scheme, encoded] = authorization.split(' ');
  if (scheme !== 'Bearer' || !encoded) {
    sendError(res, 401, 'YouTube agent approval key missing hai.');
    return false;
  }
  const supplied = Buffer.from(encoded);
  const expected = Buffer.from(accessKey);
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    sendError(res, 403, 'YouTube agent approval key valid nahi hai.');
    return false;
  }
  return true;
}

export function registerYouTubeAgentRoutes(app: Express): void {
  app.get('/api/youtube-agent/jobs', async (_req: Request, res: Response) => {
    try {
      res.set('Cache-Control', 'no-store').json({ ok: true, jobs: await readJobs() });
    } catch (error: any) {
      sendError(res, 500, error?.message || 'Agent jobs read nahi ho sake.');
    }
  });

  app.post('/api/youtube-agent/research', async (req: Request, res: Response) => {
    const topic = typeof req.body?.topic === 'string' ? req.body.topic.trim() : '';
    const channelId = typeof req.body?.channelId === 'string' ? req.body.channelId.trim() : 'itcafeteria';
    if (!topic) return sendError(res, 400, 'Topic required hai.');

    try {
      const now = new Date().toISOString();
      const job: YouTubeAgentJob = {
        id: crypto.randomBytes(16).toString('hex'),
        channelId,
        topic,
        title: `${topic.slice(0, 90)} #Shorts #ITCafeteria`,
        description: `${topic}\n\nSource-backed research job. Final metadata aur source links ko approval se pehle review karein.`,
        tags: ['itcafeteria', 'tech', 'shorts', 'urdu tech'],
        sources: [],
        stage: 'draft_ready',
        dryRun: req.body?.dryRun !== false,
        approvalRequired: true,
        createdAt: now,
        updatedAt: now,
      };
      const jobs = await readJobs();
      jobs.unshift(job);
      await writeJobs(jobs);
      res.status(201).json({ ok: true, job, message: 'Research draft bana hai. Approval se pehle source links aur video metadata verify karein.' });
    } catch (error: any) {
      sendError(res, 500, error?.message || 'Research job create nahi hua.');
    }
  });

  app.post('/api/youtube-agent/jobs/:id/approve', async (req: Request, res: Response) => {
    if (!validateAdmin(req, res)) return;

    try {
      const jobs = await readJobs();
      const job = jobs.find((entry) => entry.id === req.params.id);
      if (!job) return sendError(res, 404, 'Agent job nahi mila.');
      if (job.stage === 'published') return sendError(res, 409, 'Job already published hai.');
      if (job.stage === 'approved' || job.stage === 'publishing') {
        return sendError(res, 409, `Job ${job.stage} stage par hai.`);
      }
      if (!job.videoPath && job.dryRun) {
        return sendError(res, 400, 'Dry-run job ko public publish approval ke liye final video file chahiye.');
      }

      job.stage = 'approved';
      job.approvedAt = new Date().toISOString();
      job.updatedAt = job.approvedAt;
      await writeJobs(jobs);
      res.json({ ok: true, job, message: 'Job explicitly approved ho gaya. Abhi koi public YouTube upload nahi hua.' });
    } catch (error: any) {
      sendError(res, 500, error?.message || 'Approval save nahi hua.');
    }
  });

  app.post('/api/youtube-agent/jobs/:id/cancel', async (req: Request, res: Response) => {
    if (!validateAdmin(req, res)) return;

    try {
      const jobs = await readJobs();
      const job = jobs.find((entry) => entry.id === req.params.id);
      if (!job) return sendError(res, 404, 'Agent job nahi mila.');
      if (job.stage === 'published') return sendError(res, 409, 'Published job cancel nahi ho sakta.');
      job.stage = 'cancelled';
      job.updatedAt = new Date().toISOString();
      await writeJobs(jobs);
      res.json({ ok: true, job });
    } catch (error: any) {
      sendError(res, 500, error?.message || 'Job cancel nahi hua.');
    }
  });
}
