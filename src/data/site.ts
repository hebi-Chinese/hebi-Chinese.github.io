import dualInterface from '../assets/showcase/shuang-leng-jing.png';
import aoaiInterface from '../assets/showcase/aoai.png';
import type { ImageMetadata } from 'astro';

export interface ShowcaseProduct {
  key: 'dual' | 'aoai';
  title: string;
  description: string;
  image: ImageMetadata;
  alt: string;
}

export const showcaseProducts = [
  { key: 'dual', title: '双棱镜', description: '把对话放回上下文，再想下一句怎么说。', image: dualInterface, alt: '双棱镜完整产品界面' },
  { key: 'aoai', title: 'AOAI', description: '从声音到文字，保留已经确认的部分。', image: aoaiInterface, alt: 'AOAI 完整转写工作台界面' },
] as const satisfies readonly ShowcaseProduct[];

export const siteProfile = {
  name: '何必',
  logo: { src: '/brand/hebi-logo-v1.svg', width: 460, height: 406 },
  description: '何必的个人作品站：技术项目、长文与学习记录。',
  email: '3521739097@qq.com',
  githubUrl: 'https://github.com/hebi-Chinese',
  stack: ['Python', 'Zig', 'C#', 'LangGraph', 'PyTorch'],
  hobbies: ['游戏', '番剧', '健身房'],
} as const;

export interface CurrentSignal {
  key: string;
  code: string;
  title: string;
  detail: string;
}

export const currentSignals = [
  {
    key: 'anti-cheat',
    code: 'SYSTEMS / 01',
    title: '反作弊',
    detail: '把检测、对抗与社区规则，做成真正能长期运行的系统。',
  },
  {
    key: 'agents',
    code: 'AGENTS / 02',
    title: '多 Agent',
    detail: '研究模型怎样分工、交接、留下可审计的过程。',
  },
  {
    key: 'models',
    code: 'MODELS / 03',
    title: '模型微调',
    detail: '在有限算力里，把领域数据变成可验证的能力。',
  },
] as const satisfies readonly CurrentSignal[];

export type SectionGlyphKind = 'about' | 'projects' | 'essays' | 'notes' | 'likes' | 'now';

export interface NavigationItem {
  key: string;
  href: string;
  label: string;
  placements: readonly ('desktop' | 'mobile')[];
  openInNewTab?: boolean;
  siteIndex?: { glyph: SectionGlyphKind };
}

export const navigationItems: readonly NavigationItem[] = [
  { key: 'about', href: '/about', label: 'about', placements: ['desktop', 'mobile'], siteIndex: { glyph: 'about' } },
  { key: 'projects', href: '/projects', label: 'work', placements: ['desktop', 'mobile'], siteIndex: { glyph: 'projects' } },
  { key: 'essays', href: '/essays', label: 'essays', placements: ['desktop', 'mobile'], siteIndex: { glyph: 'essays' } },
  { key: 'notes', href: '/notes', label: 'notes', placements: ['desktop', 'mobile'], siteIndex: { glyph: 'notes' } },
  { key: 'likes', href: '/likes', label: 'likes', placements: ['desktop', 'mobile'], siteIndex: { glyph: 'likes' } },
  {
    key: 'github',
    href: siteProfile.githubUrl,
    label: 'github',
    placements: ['desktop', 'mobile'],
    openInNewTab: true,
  },
  {
    key: 'contact',
    href: `mailto:${siteProfile.email}`,
    label: 'contact',
    placements: ['mobile'],
  },
] as const;

export interface Project {
  slug: string;
  title: string;
  brief: string;
  tags: readonly string[];
  detailTitle: string;
  detail: string;
  href?: string;
  linkText?: string;
  heroSignal?: {
    label: string;
    meta: string;
    x: number;
    y: number;
  };
}

export const projects: readonly Project[] = [
  {
    "slug": "deepulse",
    "title": "Deepulse",
    "brief": "一个会陪你聊天的 AI 音乐电台。",
    "tags": [
      "AI 电台",
      "PWA"
    ],
    "detailTitle": "Deepulse",
    "detail": "听歌之外，也听听 AI DJ 的介绍和闲聊，让选歌、对话与声音串成一段电台时光。",
    "href": "https://github.com/hebi-Chinese/Deepulse",
    "linkText": "查看项目 ↗",
    "heroSignal": {
      "label": "DEEPULSE",
      "meta": "AI RADIO / PWA",
      "x": 82,
      "y": 67
    }
  },
  {
    "slug": "codex-working-board",
    "title": "Codex 工作看板",
    "brief": "把想做的事写下来，交给 Codex 推进。",
    "tags": [
      "任务调度",
      "macOS"
    ],
    "detailTitle": "Codex 工作看板",
    "detail": "在一张看板里安排任务、查看进度，遇到需要你决定的事，再回来提醒你。",
    "href": "https://github.com/hebi-Chinese/codex-working-board",
    "linkText": "查看项目 ↗",
    "heroSignal": {
      "label": "CODEX WORKBOARD",
      "meta": "TASKS / MACOS",
      "x": 78,
      "y": 30
    }
  },
  {
    "slug": "miku-codex-macos",
    "title": "MIKU for Codex",
    "brief": "给每天写代码的地方，换上喜欢的 MIKU 主题。",
    "tags": [
      "桌面主题",
      "macOS"
    ],
    "detailTitle": "MIKU for Codex",
    "detail": "从背景、图标到应援文案，为 macOS 上的 Codex 工作台添一点初音未来的气息。",
    "href": "https://github.com/hebi-Chinese/MIKU-Codex-macOS",
    "linkText": "查看主题 ↗"
  },
  {
    "slug": "cc-mcp-mimo-bridge",
    "title": "CC–MiMo Bridge",
    "brief": "让 Claude Code 和 MiMo 搭档写代码。",
    "tags": [
      "MCP",
      "模型协作"
    ],
    "detailTitle": "CC–MiMo Bridge",
    "detail": "Claude Code 拆解任务、检查结果，MiMo 接手执行，通过 MCP 把两个模型接到同一条工作流程里。",
    "href": "https://github.com/hebi-Chinese/CC-mcp-mimo-bridge",
    "linkText": "查看项目 ↗",
    "heroSignal": {
      "label": "CC–MIMO",
      "meta": "MCP / MODEL BRIDGE",
      "x": 24,
      "y": 70
    }
  },
  {
    "slug": "euterpe",
    "title": "Euterpe",
    "brief": "为 Muse Dash 玩家打造的创作社区。",
    "tags": [
      "Muse Dash",
      "创作社区"
    ],
    "detailTitle": "Euterpe",
    "detail": "发现和分享自制谱、探索模组，也为创作者提供制作与发布内容的工具。",
    "href": "https://github.com/Euterpe-org/Euterpe",
    "linkText": "探索项目 ↗",
    "heroSignal": {
      "label": "EUTERPE",
      "meta": "MUSE DASH / COMMUNITY",
      "x": 18,
      "y": 24
    }
  }
] as const;

export const getProjectDisplayNumber = (index: number) => String(index + 1).padStart(2, '0');

export type ProfileSectionKey =
  | 'future'
  | 'seasons'
  | 'badminton'
  | 'budget'
  | 'archive'
  | 'now';

export interface ProfileSection {
  key: ProfileSectionKey;
  title: string;
  prompt: string;
}

export const profileSections = [
  {
    key: 'seasons',
    title: '真爱换季',
    prompt: '如果真爱有颜色的话，那是我每个季度都会换的颜色。',
  },
  {
    key: 'badminton',
    title: '拍定乾坤',
    prompt: '两三个月没上场，球馆多少有些寂寞。何必登场，诸神退让。',
  },
  {
    key: 'budget',
    title: '预算拉满',
    prompt: '我不算乱花钱，也不算特别省。预算之内，我会买我觉得最好的。',
  },
  {
    key: 'future',
    title: '未来筹码',
    prompt: '目前还是想先多挣点钱。以后真碰到特别想做的事，至少不会先卡在钱上。',
  },
  {
    key: 'archive',
    title: '公开留痕',
    prompt: '我维护个人网站，也发 QQ 动态，歌单偶尔更新。频率不一定高，想记的时候就记一点。',
  },
  {
    key: 'now',
    title: '此刻坐标',
    prompt: '现在在哪、在干什么，就写什么。以后变了再改，没必要一开始就写死。',
  },
] as const satisfies readonly ProfileSection[];

export const getProfileDisplayNumber = (index: number) => String(index + 1).padStart(2, '0');
