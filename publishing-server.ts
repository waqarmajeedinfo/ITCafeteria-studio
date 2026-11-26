import { registerYouTubePublishingRoutes } from './youtube-publishing.js';

// server.js owns the existing Express app and deployment middleware. Keep the
// publishing routes on a distinct prefix because the legacy /api/* 404 handler
// is registered by server.js before this extension module is loaded.
const { app } = await import('./server.js');
registerYouTubePublishingRoutes(app);
