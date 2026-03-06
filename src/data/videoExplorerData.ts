// Mock video-level records for the Video Explorer table
// In production this would come from the Supabase fact_video_usage table

export interface VideoRecord {
  video_id: string;
  headline: string;
  client: string;
  channel: string;
  user: string;
  language: string;
  input_type: string;
  output_types: string[];
  duration_min: number;
  uploaded_at: string;
  processed_at: string;
  published_at: string | null;
  published_flag: boolean;
  platform: string;
  clips_generated: number;
  processing_time_min: number;
}

const CLIENTS = ['TechCorp', 'MediaHub', 'StartupXYZ', 'GlobalCo', 'BrandLabs'];
const CHANNELS = ['YouTube', 'Instagram', 'LinkedIn', 'Twitter/X', 'Podcast', 'Webinar'];
const USERS = ['Priya S.', 'Arjun M.', 'Zara K.', 'Arnav R.', 'Divya P.', 'Karan T.'];
const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Portuguese'];
const INPUT_TYPES = ['Long Video', 'Podcast', 'Webinar', 'Interview', 'Live Stream'];
const OUTPUT_TYPES = ['Reel', 'YouTube Short', 'Viral Clip', 'Chapter', 'Summary', 'Transcript'];
const PLATFORMS = ['YouTube', 'Instagram', 'LinkedIn', 'Twitter', 'TikTok'];

const HEADLINES = [
  'Q4 Product Launch Keynote — Full Presentation',
  'Building AI-First Products in 2025 — Deep Dive',
  'Founder AMA: Lessons from 0→1',
  'Weekly Marketing Roundtable #42',
  'State of Content Marketing 2025',
  'Growth Hacking with Short-Form Video',
  'Enterprise SaaS Demo Day — Spring 2025',
  'Creator Economy Summit: Day 1 Recap',
  'How We Grew to 1M ARR in 18 Months',
  'Product-Led Growth Masterclass',
  'DEI in Tech: Real Talk with Leaders',
  'Engineering Culture at Scale',
  'Designing for Accessibility — Workshop',
  'Startup Funding Landscape Update',
  'Building Scalable Data Pipelines',
  'Customer Success Stories Panel',
  'Live Q&A: AI Tools for Marketers',
  'The Future of Remote Work',
  'SaaS Pricing Strategy Deep Dive',
  'Investor Relations Update — FY2025',
  'Product Roadmap Reveal — H2',
  'Community Building Strategies',
  'Developer Experience Best Practices',
  'Webinar: Mastering LinkedIn Outreach',
  'Brand Strategy for B2B Companies',
  'Cold Email Masterclass with Examples',
  'How to Run Effective Sprint Reviews',
  'Content Repurposing Automation Summit',
  'Podcast: The Growth Mindset',
  'Vertical Video for Enterprise Teams',
  'Clip Analytics: What Works in 2025',
  'HR Tech Summit Panel Discussion',
  'Onboarding Best Practices — Live Demo',
  'SEO in the Age of AI',
  'Scaling a Remote-First Company',
  'B2B Social Media That Actually Converts',
  'ML Ops for Non-Technical Founders',
  'RevOps Alignment Workshop',
  'Async Work Culture Fireside Chat',
  'Behind the Scenes: Frammer AI Demo',
  'LinkedIn Thought Leadership Guide',
  'Video Marketing ROI Breakdown',
  'ABM Strategy for Enterprise Sales',
  'Podcast Network Launch — Live Show',
  'Pitch Deck Teardown: Top 10 Decks',
  'Customer Journey Mapping Workshop',
  'Product Hunt Launch Strategy',
  'Performance Marketing Analytics',
  'AI-Driven Content Discovery',
  'Global Expansion Playbook',
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

// Seed with deterministic pseudo-random values using index
const seededRandom = (seed: number) => {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
};

export const videoExplorerData: VideoRecord[] = HEADLINES.map((headline, i) => {
  const r = (offset = 0) => seededRandom(i * 17 + offset);
  const clientIdx = Math.floor(r(1) * CLIENTS.length);
  const channelIdx = Math.floor(r(2) * CHANNELS.length);
  const userIdx = Math.floor(r(3) * USERS.length);
  const langIdx = Math.floor(r(4) * LANGUAGES.length);
  const inputIdx = Math.floor(r(5) * INPUT_TYPES.length);
  const durationMin = Math.floor(r(6) * 160) + 15; // 15–175 min
  const processingMin = Math.floor(durationMin * (0.15 + r(7) * 0.25));
  const clipsGenerated = Math.floor(r(8) * 10) + 2;
  const uploadedOffset = Math.floor(r(9) * 365); // within last year
  const uploadedAt = addDays(new Date('2025-03-01'), uploadedOffset);
  const processedAt = addDays(uploadedAt, 0); // same day
  processedAt.setHours(processedAt.getHours() + Math.floor(processingMin / 60) + 1);
  const isPublished = r(10) > 0.25;
  const publishedAt = isPublished ? addDays(processedAt, Math.floor(r(11) * 3)) : null;

  const numOutputTypes = Math.floor(r(12) * 3) + 1;
  const shuffledOutputs = [...OUTPUT_TYPES].sort(() => r(13 + i) - 0.5).slice(0, numOutputTypes);

  return {
    video_id: `VID-${String(i + 1).padStart(4, '0')}`,
    headline,
    client: CLIENTS[clientIdx],
    channel: CHANNELS[channelIdx],
    user: USERS[userIdx],
    language: LANGUAGES[langIdx],
    input_type: INPUT_TYPES[inputIdx],
    output_types: shuffledOutputs,
    duration_min: durationMin,
    uploaded_at: formatDate(uploadedAt),
    processed_at: formatDate(processedAt),
    published_at: publishedAt ? formatDate(publishedAt) : null,
    published_flag: isPublished,
    platform: PLATFORMS[Math.floor(r(15) * PLATFORMS.length)],
    clips_generated: clipsGenerated,
    processing_time_min: processingMin,
  };
});
