import express from 'express';
import dotenv from 'dotenv';
import { registerIntegrationRoutes } from './integrations';
import { registerYouTubePublishingRoutes } from './youtube-publishing';
import { registerYouTubeAgentRoutes } from './server_youtube_agent';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({ override: true });

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

registerIntegrationRoutes(app);
registerYouTubeAgentRoutes(app);
registerYouTubePublishingRoutes(app);

const here = path.dirname(fileURLToPath(import.meta.url));
app.get(['/youtube-publishing', '/'], async (_req, res) => {
  try {
    res.type('html').send(await readFile(path.join(here, 'youtube-publishing-dashboard.html'), 'utf8'));
  } catch {
    res.status(500).send('Publishing dashboard file missing.');
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => {
  console.log(`YouTube agent and publishing service listening on port ${port}`);
});

export { app };
