
## YouTube approval-based publishing service

This repository now includes a separate Node service for an approval-gated YouTube publishing queue. Deploy it as a **second** Render Web Service from this repository (it is not wired into the main Studio server):

1. Set the service root to the repository root and runtime to Node.
2. Build command: `npm install && npm run build:publishing`
3. Start command: `npm run start:publishing`
4. Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `INTEGRATION_SECRET` (use a long random secret), and `APP_URL` (the public URL of this publishing service) to this service's environment.
5. In Google Cloud OAuth credentials, add `https://YOUR-PUBLISHING-SERVICE/api/integrations/oauth/youtube/callback` as an authorized redirect URI. Enable YouTube Data API v3 and request YouTube upload permission through the Connect button.
6. Open `https://YOUR-PUBLISHING-SERVICE/youtube-publishing`, connect the channel, upload a video, choose a future 5, 6, 7, or 8 PM Asia/Karachi slot, then approve it. Approval uploads the video as private with YouTube's scheduled publish time.

The queue is stored in `data/youtube-publishing/queue.json` and media files on the service filesystem. Use a persistent disk for the publishing service; ephemeral filesystems lose queued videos on restart/redeploy. Keep the service URL and OAuth credentials private. Build/lint verification is still required in CI or a local checkout.
