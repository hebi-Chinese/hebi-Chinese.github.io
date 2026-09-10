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

export interface NavigationItem {
  key: string;
  href: string;
  label: string;
  placements: readonly ('desktop' | 'mobile')[];
  openInNewTab?: boolean;
}

export const navigationItems: readonly NavigationItem[] = [
  { key: 'about', href: '/about', label: 'about', placements: ['desktop', 'mobile'] },
  { key: 'projects', href: '/projects', label: 'work', placements: ['desktop', 'mobile'] },
  { key: 'essays', href: '/essays', label: 'essays', placements: ['desktop', 'mobile'] },
  { key: 'notes', href: '/notes', label: 'notes', placements: ['desktop', 'mobile'] },
  { key: 'likes', href: '/likes', label: 'likes', placements: ['desktop', 'mobile'] },
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
    slug: 'euterpe',
    title: 'Euterpe',
    brief: 'Muse Dash 社区反作弊系统 · 服务社区 20k+',
    tags: ['Zig', 'C#', 'Win32 API', 'IL2CPP'],
    detailTitle: 'Euterpe 反作弊系统',
    detail: '双栈分离架构（Zig sentinel + C# Mod），DLC 三层蜜罐检测，覆盖 5 类作弊场景。独立设计与实现，社区主理人授权架构决策。',
    href: 'https://github.com/Euterpe-org',
    linkText: 'GitHub →',
    heroSignal: { label: 'EUTERPE', meta: 'ZIG / C# / ANTI-CHEAT', x: 18, y: 24 },
  },
  {
    slug: 'euterpe-bot',
    title: 'Euterpe.Bot',
    brief: '多 Agent 智能助手 · 零指令交互',
    tags: ['LangGraph', 'Python', 'PostgreSQL', 'Docker'],
    detailTitle: 'Euterpe.Bot 多 Agent 系统',
    detail: 'Worker-Writer-Supervisor 三元解耦，三级漏斗触发，PendingIntent 状态机。跨 QQ/Discord 双平台。',
    href: 'https://github.com/Euterpe-org',
    linkText: 'GitHub →',
    heroSignal: { label: 'EUTERPE.BOT', meta: 'LANGGRAPH / MULTI-AGENT', x: 78, y: 30 },
  },
  {
    slug: 'mhw-review-assistant',
    title: 'MHW 复盘助手',
    brief: 'Qwen2.5-7B 领域微调 · 端到端验证',
    tags: ['QLoRA', 'PyTorch', 'Unsloth'],
    detailTitle: 'MHW 复盘助手',
    detail: '端到端微调 pipeline：CPT 71 万 tokens + SFT 2421 条。消费级硬件验证小资源场景下 LLM 微调可行性。',
  },
  {
    slug: 'cc-mcp-mimo-bridge',
    title: 'CC-MCP-MiMo-Bridge',
    brief: '双模型协作 MCP 管线 · MIT 开源',
    tags: ['Python', 'FastMCP', 'Anthropic SDK'],
    detailTitle: 'CC-MCP-MiMo-Bridge',
    detail: 'Claude（决策 + review）+ MiMo（执行）双模型协作，单 turn 闭环。3 个 MCP 工具，trace 全程可审计。',
    href: 'https://github.com/hebi-Chinese/CC-mcp-mimo-bridge',
    linkText: 'GitHub →',
    heroSignal: { label: 'CC-MCP', meta: 'PYTHON / MODEL BRIDGE', x: 24, y: 70 },
  },
  {
    slug: 'lt-sentinel',
    title: 'LT-Sentinel',
    brief: 'LLM 多 agent 长期攻击防御层 · Lablab Hackathon 参赛作品',
    tags: ['LangGraph', 'Python', 'Go', 'Agent Security'],
    detailTitle: 'LT-Sentinel — 长期攻击防御层',
    detail: '盖在 Veea Lobster Trap 上的状态层，补 LT「每条请求独立检查」的无状态盲区：慢速注入、渐进试探、跨 session 切换、信任养成后突袭、慢渗透工具污染。范式级方案，医疗 / 金融 / 客服多 agent 场景可换皮直接套。',
    href: 'https://github.com/hebi-Chinese/lobstertrap-sentinel',
    linkText: 'GitHub →',
    heroSignal: { label: 'LT-SENTINEL', meta: 'GO / AGENT SECURITY', x: 82, y: 67 },
  },
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
