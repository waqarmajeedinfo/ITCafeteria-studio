## YouTube Agent + Approval Publishing

This branch adds a supervised YouTube agent workflow and a separate deployable publishing service. The agent creates source-cited research drafts and tracks approval state; it does not publish automatically.

### Workflow

1. Agent research creates a dry-run draft and a source list.
2. Metadata, title, sources, and final rendered video are reviewed.
3. Approval requires `APP_ACCESS_KEY` via the Bearer authorization header.
4. The approved publishing queue uploads through YouTube Data API v3 only after explicit approval.
5. The publisher stores the YouTube video ID and URL, and reconciles success/failure.

### Deploy

- Build command: `npm install && npm run build:publishing`
- Start command: `npm run start:publishing`
- Required environment: `APP_ACCESS_KEY`, `APP_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `INTEGRATION_SECRET`
- Mount a persistent disk at `data/youtube-publishing` and `data/youtube-agent`.

Approval actions require the same `APP_ACCESS_KEY` value in an `Authorization: Bearer <key>` header. No browser-cookie publisher is included.
