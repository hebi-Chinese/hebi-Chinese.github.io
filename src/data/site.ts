export const siteProfile = {
  name: '何必',
  description: '何必的个人作品站：技术项目、长文与学习记录。',
  email: '3521739097@qq.com',
  githubUrl: 'https://github.com/hebi-Chinese',
  stack: ['Python', 'Zig', 'C#', 'LangGraph', 'PyTorch'],
  hobbies: ['游戏', '番剧', '健身房'],
} as const;

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
  | 'foundation'
  | 'focus'
  | 'judgment'
  | 'anchors'
  | 'recommendation'
  | 'next-stage';

export interface ProfileSection {
  key: ProfileSectionKey;
  title: string;
  prompt: string;
  status: string;
}

export const profileSections = [
  {
    key: 'foundation',
    title: '当前底色',
    prompt: '不从出身或履历开始；留给一句现在真正愿意认领的自我描述。',
    status: '待补',
  },
  {
    key: 'focus',
    title: '正在投入',
    prompt: '此刻真正投入时间的主题、项目、能力，或者反复回到的问题。',
    status: '待补',
  },
  {
    key: 'judgment',
    title: '判断方式',
    prompt: '面对技术、产品与生活选择时，哪些标准比流行答案更重要。',
    status: '待补',
  },
  {
    key: 'anchors',
    title: '生活里的锚点',
    prompt: '让自己恢复能量、保持节奏，或者只是愿意反复做的事情。',
    status: '待补',
  },
  {
    key: 'recommendation',
    title: '最近值得推荐',
    prompt: '任何最近愿意反复分享给别人的东西；旧推荐也可以随时被替换。',
    status: '待补',
  },
  {
    key: 'next-stage',
    title: '下一阶段',
    prompt: '正在靠近什么，以及哪些部分仍然没有答案。',
    status: '待补',
  },
] as const satisfies readonly ProfileSection[];

export const getProfileDisplayNumber = (index: number) => String(index + 1).padStart(2, '0');
