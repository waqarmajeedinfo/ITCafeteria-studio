import express from 'express';
import dotenv from 'dotenv';
import { registerYouTubePublishingRoutes } from './youtube-publishing';

dotenv.config({ override: true });

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

registerYouTubePublishingRoutes(app);

const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => {
  console.log(`YouTube publishing module listening on port ${port}`);
});

export { app };
