export const skillPageUpdatedAt = '2026-07-07'

export const skillCategories = [
  { id: 'must-have', label: '必装', accent: '#e4f222' },
  { id: 'star-skills', label: '新星', accent: '#02b8cc' },
  { id: 'starter', label: '新手先用', accent: '#e4f222' },
  { id: 'creative', label: '页面素材', accent: '#5e6ad2' },
  { id: 'workflow', label: '工作流', accent: '#27a644' },
  { id: 'cli', label: 'CLI', accent: '#02b8cc' },
  { id: 'builders', label: '上线构建', accent: '#eb5757' },
  { id: 'advanced', label: '进阶', accent: '#8a8f98' },
  { id: 'directories', label: '目录', accent: '#e4f222' },
]

export const radarSkill = {
  name: 'Vibe Coding Radar Skill',
  label: 'Project picker',
  description: '把这张项目雷达变成 Codex 能读取的 Skill：先判断新手目标，再推荐项目、工具、验收路径和开工提示词。',
  url: 'https://github.com/lsy928256297-ops/vibe-coding-radar/tree/main/skills/vibe-coding-radar',
  actions: ['项目选择', 'Skill 推荐', '开工 Prompt'],
}

export const mustHaveSkills = [
  {
    rank: '01',
    signal: '含金量最高',
    name: 'Superpowers',
    description: '把软件开发方法论、工作流和 agentic skills 打成一套增强包，适合先给 AI 装上“做事方法”。',
    url: 'https://github.com/obra/superpowers',
  },
  {
    rank: '02',
    signal: '官方生态',
    name: 'Anthropic Skills',
    description: 'Claude Skill 的官方公开仓库，适合理解 Skill 的标准写法、触发方式和跨工具复用思路。',
    url: 'https://github.com/anthropics/skills',
  },
  {
    rank: '03',
    signal: 'Codex 底座',
    name: 'OpenAI Skills Catalog',
    description: 'Codex 用户最该先看的官方技能目录，用来理解怎么安装、触发和组合 Skill。',
    url: 'https://github.com/openai/skills',
  },
  {
    rank: '04',
    signal: '工程增强',
    name: 'Addy Osmani Agent Skills',
    description: '一套生产级工程 Skill，覆盖代码理解、实现、测试、重构和上线检查，适合直接提升 AI Coding 质量。',
    url: 'https://github.com/addyosmani/agent-skills',
  },
  {
    rank: '05',
    signal: '安全必看',
    name: 'NVIDIA SkillSpector',
    description: '安装第三方 Skill 前先做安全扫描，检查恶意命令、可疑网络请求和危险权限。',
    url: 'https://github.com/NVIDIA/SkillSpector',
  },
  {
    rank: '06',
    signal: '上线必备',
    name: 'Vercel Agent Skills',
    description: '网页项目做完后最需要预览、部署、检查和上线，Vercel 这一套非常适合新手拿结果。',
    url: 'https://github.com/vercel-labs/agent-skills',
  },
  {
    rank: '07',
    signal: '复现源码',
    name: 'GitHub CLI',
    description: '让 AI 能更顺地 clone、查 issue、看 release、开 PR 和管理项目来源，是复现开源项目的基本手脚。',
    url: 'https://cli.github.com/',
  },
  {
    rank: '08',
    signal: '网页手脚',
    name: 'OpenCLI',
    description: '把网站、平台和登录态浏览器变成 AI 能调用的 CLI，适合做资料抓取、网页操作和中文工作流。',
    url: 'https://github.com/jackwener/OpenCLI',
  },
  {
    rank: '09',
    signal: '真机验收',
    name: 'Playwright Skill',
    description: '让 AI 真的打开浏览器测试按钮、输入框、响应式和流程，不再只靠“看起来能跑”。',
    url: 'https://github.com/lackeyjb/playwright-skill',
  },
  {
    rank: '10',
    signal: 'Web 组件',
    name: 'shadcn/ui Skill',
    description: '做 Web Coding 时最常遇到按钮、表单、弹窗和数据表格，它能让 AI 更稳定地装组件、接样式。',
    url: 'https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/SKILL.md',
  },
]

export const risingSkills = [
  {
    rank: '01',
    growth: '近 7 天 +3,933',
    name: 'codebase-memory-mcp',
    description: '把代码库索引成持久知识图谱，让 Codex / Claude Code 更快理解文件关系、入口和修改影响面。',
    url: 'https://github.com/DeusData/codebase-memory-mcp',
  },
  {
    rank: '02',
    growth: '近 7 天 +1,387',
    name: 'SkillSpector',
    description: 'NVIDIA 开源的 Skill 安全扫描器，用来检查恶意模式、危险命令和可疑权限，特别适合新手先扫第三方仓库。',
    url: 'https://github.com/NVIDIA/SkillSpector',
  },
  {
    rank: '03',
    growth: '近 7 天 +1,145',
    name: 'pm-skills',
    description: '100+ 产品、增长、策略、发布类 agentic skills，适合让 AI 帮你做需求拆解、产品规划和上线材料。',
    url: 'https://github.com/phuryn/pm-skills',
  },
  {
    rank: '04',
    growth: '近 7 天 +887',
    name: '归藏 PPT Skill',
    description: '中文创作者很容易理解的高展示度 Skill：把内容做成网页 PPT、发布页、长图和社媒封面。',
    url: 'https://github.com/op7418/guizang-ppt-skill',
  },
  {
    rank: '05',
    growth: '近 7 天 +699',
    name: 'awesome-agent-skills',
    description: '跨 Claude Code、Codex、Gemini CLI、Cursor 的 Skill 目录，适合新手继续找可安装的能力包。',
    url: 'https://github.com/VoltAgent/awesome-agent-skills',
  },
  {
    rank: '06',
    growth: '近 7 天 +643',
    name: 'OpenCLI',
    description: '把网站、平台和登录态浏览器变成 AI 能调用的 CLI，适合资料抓取、网页操作和中文工作流。',
    url: 'https://github.com/jackwener/OpenCLI',
  },
  {
    rank: '07',
    growth: '近 7 天 +606',
    name: 'claude-skills',
    description: '社区维护的 Claude / Codex / Gemini / Cursor 多工具 Skill 合集，适合找通用工作流模板。',
    url: 'https://github.com/alirezarezvani/claude-skills',
  },
  {
    rank: '08',
    growth: '近 7 天 +342',
    name: '飞书 / Lark CLI',
    description: '飞书官方 CLI，覆盖 Messenger、Docs、Base、Sheets、Calendar 等场景，中文团队很容易用起来。',
    url: 'https://github.com/larksuite/cli',
  },
  {
    rank: '09',
    growth: '近 7 天 +312',
    name: 'NVIDIA Skills',
    description: 'NVIDIA 官方 AI agent skills 集合，适合关注模型、GPU、推理和 NVIDIA 生态的新手继续探索。',
    url: 'https://github.com/NVIDIA/skills',
  },
  {
    rank: '10',
    growth: '近 7 天 +312',
    name: 'OpenAI Skills Catalog',
    description: 'Codex 官方 Skill 目录，适合新手先理解 Skill 如何安装、触发、组合和复用。',
    url: 'https://github.com/openai/skills',
  },
]

export const skillSections = [
  {
    id: 'starter',
    eyebrow: '02 · First Run',
    title: '新手先用',
    description: '先装能降低开工阻力的入口型 Skill，再去挑更具体的工具。',
    cards: [
      ['01', '最高优先', 'Claude Skills', '最容易向新手解释的 Skill 入口：让 Claude 在文档、设计、协作工具里按固定方法做事。', 'https://claude.com/docs/skills/overview'],
      ['02', 'Codex 官方', 'OpenAI Skills Catalog', 'Codex 用户最该先看的官方目录，适合理解 Skill 怎么安装、怎么触发、怎么复用。', 'https://github.com/openai/skills'],
      ['03', '找技能', 'find-skills', '当用户不知道该装什么 Skill 时，先让代理帮你找，这是最符合新手真实问题的入口。', 'https://agentskills.to/'],
      ['04', '上线必备', 'Vercel Deploy Skills', '新手做完网页后最想要的就是公开链接。Vercel 相关 Skill 能把“本地作品”推到线上。', 'https://github.com/vercel-labs/agent-skills'],
    ],
  },
  {
    id: 'creative',
    eyebrow: '03 · Visual Output',
    title: '做页面和素材',
    description: '页面、设计稿、PPT、海报和真实浏览器验收，是 Vibe Coding 最容易出成果的组合。',
    cards: [
      ['05', 'UI 爆款', 'shadcn/ui Skill', '新手做 Web App 最容易用到的 UI Skill。它能让代理按项目配置正确添加组件。', 'https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/SKILL.md'],
      ['06', '设计稿', 'Figma Skills', '适合把设计稿、组件、变量和页面结构交给 AI 理解，减少“截图转代码”的瞎猜。', 'https://claude.com/skills'],
      ['07', '视觉素材', 'Canva Skills', '适合做海报、长图、分享图、PPT 视觉包装。对非工程新手尤其友好。', 'https://claude.com/skills'],
      ['08', '社区爆款', '归藏 PPT Skill', '把横向翻页网页 PPT、杂志风页面和发布会式演示变成可复用 Skill，适合新手马上做出视觉成果。', 'https://github.com/op7418/guizang-ppt-skill'],
      ['09', '页面质检', 'Vercel Web Design Guidelines', '新手最容易做出“能跑但不好用”的页面，这个 Skill 负责检查可访问性、焦点态和移动端。', 'https://github.com/vercel-labs/agent-skills'],
    ],
  },
  {
    id: 'workflow',
    eyebrow: '04 · Daily Workflow',
    title: '日常工作流',
    description: '文档、知识库、团队任务和自动化，适合把 AI 变成每天都能用上的工具。',
    cards: [
      ['10', '知识库', 'Notion Skills', '把需求、资料、任务、项目管理和知识库交给 AI 处理，新手不用反复复制粘贴上下文。', 'https://claude.com/skills'],
      ['11', 'Office', 'Document Skills', 'Word、Excel、PowerPoint、PDF 这类 Skill 对新手非常直接：把资料变成文档、表格和汇报。', 'https://github.com/anthropics/skills'],
      ['12', '项目协作', 'Atlassian / Jira Skills', '把需求、任务、缺陷和进度接入 AI，适合已经在团队工具里工作的用户。', 'https://claude.com/skills'],
      ['13', '自动化', 'Zapier Skills', '把常见 SaaS 串起来，新手不用先学 API，也能理解“让 AI 帮我自动处理流程”。', 'https://claude.com/skills'],
    ],
  },
  {
    id: 'cli',
    eyebrow: '05 · CLI Hands',
    title: 'CLI 工作流',
    description: '让 AI 能稳定读取、操作、提交和复现，不只是在聊天框里给建议。',
    cards: [
      ['14', '中文办公', '飞书 / Lark CLI', '飞书 CLI 能覆盖消息、文档、多维表格、日历、会议纪要、任务等，对中文团队特别实用。', 'https://github.com/larksuite/cli'],
      ['15', '代码协作', 'GitHub CLI', 'GitHub CLI 是 PR、issue、release、repo 自动化的基础工具，适合和代码 review Skill 配合。', 'https://cli.github.com/'],
      ['16', '网页自动化', 'OpenCLI', 'OpenCLI 把网站、桌面应用和公开 API 变成命令行入口，适合让 AI 代理稳定搜索、读取和操作。', 'https://github.com/jackwener/opencli'],
      ['17', '私域资料', '微信 wx-cli', 'wx-cli 适合把本地微信会话变成可搜索、可导出的资料源，但要特别注意隐私和授权边界。', 'https://github.com/jackwener/wx-cli'],
    ],
  },
  {
    id: 'builders',
    eyebrow: '06 · Builders',
    title: '做应用上线',
    description: '从本地演示到线上可用，优先补浏览器验收、数据库、模型和监控能力。',
    cards: [
      ['18', '真机检查', 'Playwright Skill', '让 AI 真打开浏览器测试页面，而不是只在代码里猜。适合按钮、表单、移动端、canvas 项目。', 'https://github.com/lackeyjb/playwright-skill'],
      ['19', '数据库', 'Supabase Agent Skills', '新手做登录、数据库、权限、实时数据时很容易卡住，Supabase Skill 能把规范补上。', 'https://github.com/supabase/agent-skills'],
      ['20', 'AI Demo', 'Hugging Face Skills', '适合把模型、数据集、Gradio/Spaces demo 接到 AI Coding 流程里。', 'https://github.com/huggingface/skills'],
      ['21', '错误监控', 'Sentry Agent Skills', '上线后出错怎么办？Sentry 相关 Skill 适合定位错误、修复 issue 和维护 SDK 接入，不是项目起步时的默认项。', 'https://github.com/getsentry/skills'],
    ],
  },
  {
    id: 'advanced',
    eyebrow: '07 · Later',
    title: '进阶再看',
    description: '这些很强，但更适合已经知道自己要做哪类项目之后再装。',
    cards: [
      ['22', '进阶云', 'Cloudflare Skills', 'Workers、Pages、KV、R2、D1 都很强，但对纯新手来说解释成本比 Vercel 高。', 'https://github.com/cloudflare/skills'],
      ['23', '安全审计', 'Trail of Bits Skills', '专业安全 Skill 非常有价值，但新手第一眼不一定能感到“马上好用”。', 'https://github.com/trailofbits/skills'],
      ['24', '模型服务', 'Together AI Skills', '适合开源模型推理和模型 API 项目，但不如 Claude / OpenAI / Hugging Face 容易被新手理解，先放观察位。', 'https://github.com/togethercomputer/skills'],
      ['25', '特定栈', 'Qt Agent Skills', 'Qt 官方研发团队的 Skill，适合桌面应用和嵌入式 UI，但不是大众新手优先项。', 'https://github.com/TheQtCompanyRnD/agent-skills'],
    ],
  },
].map((section) => ({
  ...section,
  cards: section.cards.map(([rank, signal, name, description, url]) => ({ rank, signal, name, description, url })),
}))

export const skillDirectories = [
  {
    name: 'Awesome Agent Skills',
    description: '官方团队和真实项目优先的 Skill 合集',
    url: 'https://github.com/VoltAgent/awesome-agent-skills',
  },
  {
    name: 'Awesome Claude Code & Skills',
    description: 'Claude Code 生态、社区工具和 Skill 目录线索',
    url: 'https://github.com/GetBindu/awesome-claude-code-and-skills',
  },
  {
    name: 'AgentSkills Marketplace',
    description: '按周热度和目录入口浏览 Skills',
    url: 'https://agentskills.to/',
  },
  {
    name: 'MDSkill',
    description: '跨 Claude、Cursor、Codex、Copilot 的 Skill / Agent 目录',
    url: 'https://mdskill.dev/',
  },
]
