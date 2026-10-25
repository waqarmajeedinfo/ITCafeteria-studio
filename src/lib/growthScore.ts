export interface YouTubeSummary {
  views: number;
  minutesWatched: number;
  avgViewDuration: number;
  avgViewPercentage: number;
  subscribersGained: number;
  subscribersLost: number;
  netSubscribers: number;
  likes: number;
  comments: number;
  shares: number;
  interactions: number;
  engagementRate: number;
  subscribersPer1kViews: number;
  uploads: number;
}

export interface YouTubeDailyRow {
  date: string;
  views: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number;
  averageViewPercentage: number;
  subscribersGained: number;
  subscribersLost: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface YouTubeInsights {
  provider: 'youtube';
  days: number;
  channel: {
    id: string;
    title: string;
    avatar: string;
    subscribers: number | null;
    customUrl: string;
  };
  range: {
    startDate: string;
    endDate: string;
    previousStartDate: string;
    previousEndDate: string;
  };
  summary: YouTubeSummary;
  previousSummary: YouTubeSummary;
  daily: YouTubeDailyRow[];
  previousDaily: YouTubeDailyRow[];
  trafficSources: Array<{ source: string; views: number; minutesWatched: number }>;
  viewerTypes: Array<{ type: string; views: number }>;
  devices: Array<{ device: string; views: number; minutesWatched: number }>;
  countries: Array<{
    country: string;
    views: number;
    minutesWatched: number;
    avgViewDuration: number;
  }>;
  contentTypes: Array<{ type: string; views: number; minutesWatched: number }>;
  topVideos: Array<{
    id: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
    durationSeconds: number;
    views: number;
    minutesWatched: number;
    avgViewDuration: number;
    avgViewPercentage: number;
    likes: number;
    comments: number;
    shares: number;
    subscribersGained: number;
    engagementRate: number;
  }>;
  notes: string[];
  fetchedAt: string;
  cached?: boolean;
}

export interface TikTokInsights {
  provider: 'tiktok';
  profile: {
    id: string;
    name: string;
    avatar: string;
    followers: number | null;
    following: number | null;
    likes: number | null;
    videoCount: number | null;
    verified: boolean;
    statsAvailable: boolean;
  };
  summary: {
    videosAnalyzed: number;
    totalViews: number;
    averageViews: number;
    medianViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    interactions: number;
    engagementRate: number;
    averageLikes: number;
    likeFollowerRatio: number | null;
    shareRate: number;
    commentRate: number;
    postsPerWeek: number;
    spanDays: number;
  };
  videos: Array<{
    id: string;
    title: string;
    description: string;
    createdAt: string;
    duration: number;
    cover: string;
    url: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
  }>;
  notes: string[];
  fetchedAt: string;
  cached?: boolean;
}

export type ScoreTone = 'emerald' | 'cyan' | 'amber' | 'rose';

export interface GrowthComponent {
  key: string;
  label: string;
  score: number | null;
  max: number;
  value: string;
  benchmark: string;
  hint: string;
}

export interface GrowthAction {
  id: string;
  priority: 'P1' | 'P2' | 'P3';
  title: string;
  evidence: string;
  action: string;
  platform: 'youtube' | 'tiktok';
}

export interface GrowthScoreResult {
  total: number;
  grade: string;
  gradeLabel: string;
  tone: ScoreTone;
  confidence: 'High' | 'Medium' | 'Low';
  availablePoints: number;
  components: GrowthComponent[];
  actions: GrowthAction[];
}

export interface TrafficShare {
  source: string;
  label: string;
  views: number;
  share: number;
}

export interface YouTubeDerived {
  traffic: TrafficShare[];
  topSource: TrafficShare | null;
  searchShare: number | null;
  shortsFeedShare: number | null;
  browseSuggestedShare: number | null;
  returningShare: number | null;
  newViewerShare: number | null;
  shortsViewShare: number | null;
  uploadsPerWeek: number;
  momentumPct: number | null;
  rangeDays: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const percentOf = (part: number, total: number) => (total > 0 ? (part / total) * 100 : 0);

const SOURCE_LABELS: Record<string, string> = {
  SHORTS: 'Shorts Feed',
  SHORTS_FEED: 'Shorts Feed',
  YT_SEARCH: 'YouTube Search',
  SEARCH: 'YouTube Search',
  BROWSE: 'Browse / Home',
  BROWSE_FEATURES: 'Browse Features',
  SUGGESTED_VIDEO: 'Suggested Videos',
  RELATED_VIDEO: 'Suggested Videos',
  CHANNEL: 'Channel Pages',
  CHANNEL_PAGES: 'Channel Pages',
  EXTERNAL: 'External / Google',
  EXT_URL: 'External URL',
  NOTIFICATION: 'Notifications',
  PLAYLIST: 'Playlists',
  END_SCREEN: 'End Screen',
  NO_LINK_OTHER: 'Direct / Unknown',
  NO_LINK_EMBEDDED: 'Embedded Player',
  YT_OTHER_PAGE: 'Other YouTube',
  OTHER: 'Other',
};

export function prettySource(source: string): string {
  return SOURCE_LABELS[String(source || '').toUpperCase()] || String(source || 'Unknown').replace(/_/g, ' ');
}

function isShortsSource(source: string): boolean {
  return /SHORTS/i.test(source);
}

function isSearchSource(source: string): boolean {
  return /SEARCH/i.test(source);
}

function isBrowseSource(source: string): boolean {
  const value = String(source || '').toUpperCase();
  return value === 'BROWSE' || value === 'BROWSE_FEATURES' || value.includes('SUGGEST');
}

export function deriveYouTube(data: YouTubeInsights): YouTubeDerived {
  const trafficViews = data.trafficSources.reduce((sum, item) => sum + item.views, 0);
  const traffic = data.trafficSources
    .map((item) => ({
      source: item.source,
      label: prettySource(item.source),
      views: item.views,
      share: round(percentOf(item.views, trafficViews)),
    }))
    .sort((a, b) => b.views - a.views);
  const topSource = traffic.length ? traffic[0] : null;
  const searchViews = data.trafficSources
    .filter((item) => isSearchSource(item.source))
    .reduce((sum, item) => sum + item.views, 0);
  const shortsFeedViews = data.trafficSources
    .filter((item) => isShortsSource(item.source))
    .reduce((sum, item) => sum + item.views, 0);
  const browseViews = data.trafficSources
    .filter((item) => isBrowseSource(item.source))
    .reduce((sum, item) => sum + item.views, 0);

  const viewerTotal = data.viewerTypes.reduce((sum, item) => sum + item.views, 0);
  const returningViews = data.viewerTypes
    .filter((item) => /RETURN/i.test(item.type))
    .reduce((sum, item) => sum + item.views, 0);
  const newViews = data.viewerTypes
    .filter((item) => /NEW/i.test(item.type))
    .reduce((sum, item) => sum + item.views, 0);

  const contentTotal = data.contentTypes.reduce((sum, item) => sum + item.views, 0);
  const shortsViews = data.contentTypes
    .filter((item) => /SHORTS/i.test(item.type))
    .reduce((sum, item) => sum + item.views, 0);

  const summary = data.summary;
  const previous = data.previousSummary;
  const momentumPct =
    previous.views > 0 ? round(((summary.views - previous.views) / previous.views) * 100) : null;

  return {
    traffic,
    topSource,
    searchShare: trafficViews > 0 ? round(percentOf(searchViews, trafficViews)) : null,
    shortsFeedShare: trafficViews > 0 ? round(percentOf(shortsFeedViews, trafficViews)) : null,
    browseSuggestedShare: trafficViews > 0 ? round(percentOf(browseViews, trafficViews)) : null,
    returningShare: viewerTotal > 0 ? round(percentOf(returningViews, viewerTotal)) : null,
    newViewerShare: viewerTotal > 0 ? round(percentOf(newViews, viewerTotal)) : null,
    shortsViewShare: contentTotal > 0 ? round(percentOf(shortsViews, contentTotal)) : null,
    uploadsPerWeek: data.days > 0 ? round((summary.uploads / data.days) * 7) : 0,
    momentumPct,
    rangeDays: data.days,
  };
}

export function gradeForScore(total: number): { grade: string; label: string; tone: ScoreTone } {
  if (total >= 85) return { grade: 'A+', label: 'Elite momentum', tone: 'emerald' };
  if (total >= 75) return { grade: 'A', label: 'Strong growth engine', tone: 'emerald' };
  if (total >= 65) return { grade: 'B', label: 'Good, polish needed', tone: 'cyan' };
  if (total >= 50) return { grade: 'C', label: 'Fix the leaks', tone: 'amber' };
  return { grade: 'D', label: 'Basics pe focus', tone: 'rose' };
}

function buildResult(
  components: GrowthComponent[],
  actions: GrowthAction[],
  confidence: GrowthScoreResult['confidence']
): GrowthScoreResult {
  const available = components.filter((item) => item.score !== null);
  const availablePoints = available.reduce((sum, item) => sum + item.max, 0);
  const earned = available.reduce((sum, item) => sum + (item.score || 0), 0);
  const total = availablePoints > 0 ? Math.round((earned / availablePoints) * 100) : 0;
  const grade = gradeForScore(total);
  return {
    total,
    grade: grade.grade,
    gradeLabel: grade.label,
    tone: grade.tone,
    confidence,
    availablePoints,
    components,
    actions,
  };
}

export function scoreYouTube(data: YouTubeInsights, derived: YouTubeDerived): GrowthScoreResult {
  const summary = data.summary;
  const views = summary.views;
  const hasViews = views > 0;
  const targetUploads = Math.max(3, Math.round((data.days / 7) * 3));

  const retentionPct = summary.avgViewPercentage;
  const retentionScore = hasViews
    ? clamp((retentionPct / 65) * 20, 0, 20) + clamp(((retentionPct - 65) / 35) * 5, 0, 5)
    : null;

  const engagementRate = summary.engagementRate;
  const engagementScore = hasViews ? clamp((engagementRate / 5) * 15, 0, 15) : null;

  const conversion = summary.subscribersPer1kViews;
  const conversionScore = hasViews
    ? clamp((Math.max(conversion, 0) / 5) * 10, 0, 10) +
      clamp(((conversion - 5) / 10) * 5, 0, 5)
    : null;

  let discoveryScore: number | null = null;
  if (derived.traffic.length) {
    const diversity = 1 - derived.traffic.reduce((sum, item) => sum + Math.pow(item.share / 100, 2), 0);
    const diversityScore = clamp((diversity / 0.78) * 6, 0, 6);
    const shortsScore = clamp(((derived.shortsFeedShare || 0) / 35) * 4, 0, 4);
    discoveryScore = diversityScore + shortsScore;
  }

  const returningScore =
    derived.returningShare !== null ? clamp((derived.returningShare / 20) * 10, 0, 10) : null;

  const consistencyScore = clamp((summary.uploads / targetUploads) * 10, 0, 10);

  const momentumScore =
    derived.momentumPct !== null ? clamp(5 + (derived.momentumPct / 20) * 5, 0, 10) : null;

  const formatScore =
    derived.shortsViewShare !== null ? clamp((derived.shortsViewShare / 60) * 5, 0, 5) : null;

  const components: GrowthComponent[] = [
    {
      key: 'retention',
      label: 'Retention / Avg viewed',
      score: retentionScore === null ? null : round(retentionScore),
      max: 25,
      value: hasViews ? `${retentionPct}%` : 'No views',
      benchmark: '50%+ acha, 65%+ strong',
      hint: 'AverageViewPercentage se weighted. Shorts mein 100%+ loop ka matlab replay.',
    },
    {
      key: 'engagement',
      label: 'Engagement rate',
      score: engagementScore === null ? null : round(engagementScore),
      max: 15,
      value: `${engagementRate}%`,
      benchmark: '4–6% healthy',
      hint: `Likes + comments + shares = ${summary.interactions.toLocaleString()} interactions.`,
    },
    {
      key: 'conversion',
      label: 'Subscriber conversion',
      score: conversionScore === null ? null : round(conversionScore),
      max: 15,
      value: `${conversion} / 1K views`,
      benchmark: '5+ per 1K strong',
      hint: `Net subscribers ${summary.netSubscribers >= 0 ? '+' : ''}${summary.netSubscribers.toLocaleString()}.`,
    },
    {
      key: 'discovery',
      label: 'Discovery mix',
      score: discoveryScore === null ? null : round(discoveryScore),
      max: 10,
      value: derived.traffic.length
        ? `Shorts feed ${derived.shortsFeedShare ?? 0}%`
        : 'No breakdown',
      benchmark: 'Shorts feed 25–40%+, koi source <70%',
      hint: 'Traffic sources ki diversity + Shorts feed share ka mix.',
    },
    {
      key: 'returning',
      label: 'Returning-view share',
      score: returningScore === null ? null : round(returningScore),
      max: 10,
      value: derived.returningShare === null ? 'No data' : `${derived.returningShare}% of views`,
      benchmark: '20%+ loyal returning views',
      hint: 'YouTube viewer-type dimension (views) ke hisaab se. Low share ka matlab series bridge weak hai.',
    },
    {
      key: 'consistency',
      label: 'Upload consistency',
      score: round(consistencyScore),
      max: 10,
      value: `${summary.uploads} uploads / ${data.days} days`,
      benchmark: `${targetUploads} uploads target (3/week)`,
      hint: `Current pace ${derived.uploadsPerWeek}/week.`,
    },
    {
      key: 'momentum',
      label: 'Views momentum',
      score: momentumScore === null ? null : round(momentumScore),
      max: 10,
      value: derived.momentumPct === null ? 'No previous data' : `${derived.momentumPct >= 0 ? '+' : ''}${derived.momentumPct}%`,
      benchmark: '+10% ya better',
      hint: `Previous ${data.days} days: ${data.previousSummary.views.toLocaleString()} views.`,
    },
    {
      key: 'format',
      label: 'Shorts format mix',
      score: formatScore === null ? null : round(formatScore),
      max: 5,
      value: derived.shortsViewShare === null ? 'No data' : `${derived.shortsViewShare}% Shorts views`,
      benchmark: '60%+ Shorts-first',
      hint: 'Creator content type ke hisaab se Shorts vs long-form view share.',
    },
  ];

  const actions: GrowthAction[] = [];
  const add = (
    id: string,
    priority: GrowthAction['priority'],
    title: string,
    evidence: string,
    action: string
  ) => actions.push({ id, priority, title, evidence, action, platform: 'youtube' });

  if (hasViews && retentionPct < 50) {
    add(
      'yt-retention',
      'P1',
      'Pehle 2 second ka payoff strong karein',
      `Avg viewed ${retentionPct}% — 50% target se ${round(50 - retentionPct)} points neeche.`,
      'Scene 1 mein result ya curiosity gap turant dikhayein. Intro/logo delay hatayein, cuts tighter karein aur pehle 3 seconds ka alag A/B test chalayein.'
    );
  }
  if (derived.shortsFeedShare !== null && derived.shortsFeedShare < 20) {
    add(
      'yt-shorts-feed',
      'P1',
      'Shorts Feed distribution barhayein',
      `Shorts feed sirf ${derived.shortsFeedShare}% traffic la raha hai.`,
      'Hook ko visual pattern-interrupt banayein, first-frame par bold 3–5 word text rakhein, aur ending ko loopable banayein taake swipe-away kam ho.'
    );
  } else if (derived.searchShare !== null && derived.searchShare > 70) {
    add(
      'yt-search-mix',
      'P2',
      'Search dependency kam karein',
      `YouTube Search ${derived.searchShare}% traffic de raha hai.`,
      'Titles search-first hain, lekin Shorts feed ke liye curiosity-first packaging test karein. Same topic par 2 different hooks/thumbnail text compare karein.'
    );
  }
  if (hasViews && conversion < 4) {
    add(
      'yt-conversion',
      'P1',
      'Subscriber conversion improve karein',
      `${conversion} subs / 1K views — strong benchmark 5+ hai.`,
      'Video ke 60–75% point par ek specific reason de kar subscribe maangein ("next part mein X"). Pinned comment mein series link rakhein.'
    );
  }
  if (derived.returningShare !== null && derived.returningShare < 15) {
    add(
      'yt-returning',
      'P2',
      'Returning audience build karein',
      `Sirf ${derived.returningShare}% views returning viewers se aa rahe hain.`,
      'Har Short ko series ka part banayein: end par next episode ka tease, same visual signature aur episode number. Generic "follow for more" ki jagah specific next payoff dein.'
    );
  }
  if (summary.uploads < targetUploads * 0.7) {
    add(
      'yt-consistency',
      'P2',
      'Upload cadence stable karein',
      `${summary.uploads} uploads in ${data.days} days (target ${targetUploads}).`,
      'Hafte mein 3 Shorts ka fixed slot rakhein. Ek sitting mein 3–4 videos batch record karein taake consistency na toote.'
    );
  }
  if (hasViews && engagementRate < 3) {
    add(
      'yt-engagement',
      'P2',
      'Engagement trigger add karein',
      `Engagement rate ${engagementRate}% — 4% se neeche.`,
      'Ek clear question ya choice end par rakhein ("A ya B?"), aur pinned comment mein reply-worthy sawal poochein. Over-asking se bachein.'
    );
  }
  if (derived.momentumPct !== null && derived.momentumPct < -15) {
    add(
      'yt-momentum',
      'P1',
      'Views dip ka root cause isolate karein',
      `Views previous period se ${derived.momentumPct}% kam hain.`,
      'Top 3 aur bottom 3 videos ke hooks, topic aur length compare karein. Jo format pehle chala, usi pattern par next 2 uploads karein.'
    );
  }
  if (derived.shortsViewShare !== null && derived.shortsViewShare < 40) {
    add(
      'yt-format-mix',
      'P3',
      'Shorts-first mix test karein',
      `Shorts views ka sirf ${derived.shortsViewShare}% hain.`,
      'Channel Shorts par focus karta hai to long-form uploads ko Shorts clips mein break karein aur alag hook ke sath post karein.'
    );
  }
  if (!actions.length) {
    add(
      'yt-maintain',
      'P3',
      'Winning pattern ko repeat karein',
      'Saare major metrics healthy range mein hain.',
      'Top video ka hook structure, topic angle aur length likh kar template banayein. Agle 3 uploads usi pattern par karein, phir ek naya angle test karein.'
    );
  }

  const confidence: GrowthScoreResult['confidence'] =
    views >= 2000 && data.days >= 28 && derived.traffic.length
      ? 'High'
      : views >= 300
        ? 'Medium'
        : 'Low';
  return buildResult(components, actions.slice(0, 6), confidence);
}

export function scoreTikTok(data: TikTokInsights): GrowthScoreResult {
  const summary = data.summary;
  const videos = data.videos.filter((video) => video.views > 0);
  const hasData = videos.length > 0;

  const engagementScore = hasData ? clamp((summary.engagementRate / 5) * 30, 0, 30) : null;

  let consistencyScore: number | null = null;
  let coefficient = 0;
  if (videos.length >= 3) {
    const mean = summary.averageViews || 1;
    const variance =
      videos.reduce((sum, video) => sum + Math.pow(video.views - mean, 2), 0) / videos.length;
    coefficient = Math.sqrt(variance) / mean;
    consistencyScore = clamp(((1.6 - coefficient) / 1.1) * 20, 0, 20);
  }

  const likeFollowerScore =
    summary.likeFollowerRatio !== null
      ? clamp((summary.likeFollowerRatio / 8) * 15, 0, 15)
      : null;

  const shareScore = hasData ? clamp((summary.shareRate / 1) * 15, 0, 15) : null;
  const cadenceScore = clamp((summary.postsPerWeek / 3) * 10, 0, 10);
  const commentScore = hasData ? clamp((summary.commentRate / 0.4) * 10, 0, 10) : null;

  const components: GrowthComponent[] = [
    {
      key: 'tt-engagement',
      label: 'Engagement rate',
      score: engagementScore === null ? null : round(engagementScore),
      max: 30,
      value: `${summary.engagementRate}%`,
      benchmark: '5%+ strong',
      hint: 'Likes + comments + shares per view (recent 20 videos).',
    },
    {
      key: 'tt-consistency',
      label: 'View consistency',
      score: consistencyScore === null ? null : round(consistencyScore),
      max: 20,
      value: videos.length >= 3 ? `CV ${round(coefficient, 2)}` : 'Need 3+ videos',
      benchmark: 'CV 0.5 se kam = predictable',
      hint: 'Views ka spread. High CV matlab kuch videos chalke, baaki nahi.',
    },
    {
      key: 'tt-like-follower',
      label: 'Like-to-follower ratio',
      score: likeFollowerScore === null ? null : round(likeFollowerScore),
      max: 15,
      value:
        summary.likeFollowerRatio === null
          ? 'Stats unavailable'
          : `${summary.likeFollowerRatio}%`,
      benchmark: '8%+ strong',
      hint: 'Average likes per video ÷ followers. Audience quality ka signal.',
    },
    {
      key: 'tt-share',
      label: 'Share rate',
      score: shareScore === null ? null : round(shareScore),
      max: 15,
      value: `${summary.shareRate}%`,
      benchmark: '1%+ strong',
      hint: 'Shares per view. Viral distribution ka sabse tez signal.',
    },
    {
      key: 'tt-cadence',
      label: 'Posting cadence',
      score: round(cadenceScore),
      max: 10,
      value: `${summary.postsPerWeek} / week`,
      benchmark: '3+ per week',
      hint: 'Recent 20 videos ke time span se estimate.',
    },
    {
      key: 'tt-comments',
      label: 'Comment rate',
      score: commentScore === null ? null : round(commentScore),
      max: 10,
      value: `${summary.commentRate}%`,
      benchmark: '0.4%+ strong',
      hint: 'Comments per view. Conversation trigger ka signal.',
    },
  ];

  const actions: GrowthAction[] = [];
  const add = (
    id: string,
    priority: GrowthAction['priority'],
    title: string,
    evidence: string,
    action: string
  ) => actions.push({ id, priority, title, evidence, action, platform: 'tiktok' });

  if (hasData && summary.engagementRate < 3) {
    add(
      'tt-engagement',
      'P1',
      'Hook aur CTA upgrade karein',
      `Engagement rate ${summary.engagementRate}% — 5% benchmark se neeche.`,
      'First 1.5 seconds mein visual movement + text hook rakhein. Caption mein ek binary sawal poochein aur end par natural CTA dein.'
    );
  }
  if (videos.length >= 3 && coefficient > 0.8) {
    add(
      'tt-consistency',
      'P1',
      'Repeatable format lock karein',
      `View consistency CV ${round(coefficient, 2)} — 0.5 target se zyada spread.`,
      'Top 3 videos ka common factor (topic, opening, length) likhein. Next 5 posts usi template par banayein; outliers ko ignore karein.'
    );
  }
  if (hasData && summary.shareRate < 0.5) {
    add(
      'tt-share',
      'P2',
      'Share trigger add karein',
      `Share rate ${summary.shareRate}% — 1% strong benchmark se neeche.`,
      'Ek "send this to someone who..." moment script mein rakhein, ya checklist/tool screenshot save-worthy banayein.'
    );
  }
  if (summary.postsPerWeek < 2) {
    add(
      'tt-cadence',
      'P2',
      'Batch recording se cadence barhayein',
      `Recent videos ka pace ${summary.postsPerWeek}/week hai.`,
      'Ek din mein 3–4 Shorts record karein. 3 fixed posting slots (e.g., Mon/Wed/Fri) rakhein aur backlog maintain karein.'
    );
  }
  if (hasData && summary.commentRate < 0.2) {
    add(
      'tt-comments',
      'P3',
      'Comment conversation trigger karein',
      `Comment rate ${summary.commentRate}% — 0.4% se neeche.`,
      'Caption ke end par ek specific question poochein. Pinned comment mein apna jawab dein taake log reply karna start karein.'
    );
  }
  if (summary.likeFollowerRatio !== null && summary.likeFollowerRatio < 3) {
    add(
      'tt-like-follower',
      'P3',
      'Content-audience match tighten karein',
      `Average likes followers ka sirf ${summary.likeFollowerRatio}% hain.`,
      'Jo top 3 videos sabse zyada likes la rahi hain, unhi topics/angles ko repeat karein. Profile bio mein clear promise likhein.'
    );
  }
  if (!actions.length) {
    add(
      'tt-maintain',
      'P3',
      'Winning TikTok format scale karein',
      'Engagement aur consistency dono healthy range mein hain.',
      'Top video ko series bana kar 3-part follow-up plan karein. Har part mein same visual signature aur next-part tease rakhein.'
    );
  }

  const confidence: GrowthScoreResult['confidence'] =
    videos.length >= 10 && summary.totalViews >= 2000
      ? 'High'
      : videos.length >= 5
        ? 'Medium'
        : 'Low';
  return buildResult(components, actions.slice(0, 6), confidence);
}
