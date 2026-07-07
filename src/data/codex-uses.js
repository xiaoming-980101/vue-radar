export const codexCases = [
  {
    rank: '01',
    tag: '优化网速',
    title: '让 Codex 优化你的网速',
    result: '排查网络设置，整理可以尝试的优化步骤。',
    sourceLabel: 'X 实测',
    sourceUrl: 'https://x.com/hqmank/status/2058007157187215816',
    prompt: '请你作为网速优化助手，先检查当前网络、DNS、代理、Wi-Fi、路由器和测速结果，给我一份从安全到激进的优化步骤；如果要改系统网络配置或重置设置，必须先解释风险并等我确认。',
  },
  {
    rank: '02',
    tag: '释放空间',
    title: '让 Codex 给硬盘腾出空间',
    result: '找出可清理的缓存、大文件和下载残留。',
    sourceLabel: 'X 实测',
    sourceUrl: 'https://x.com/KanoiKrishnav/status/2043675556764647675',
    prompt: '请你作为硬盘清理助手，先只读检查我的磁盘空间占用，列出可以释放空间的缓存、大文件、下载残留和构建产物；不要直接删除任何文件，每一项都说明能释放多少、风险是什么，并等我确认。',
  },
  {
    rank: '03',
    tag: '插件修复',
    title: '让 Codex 修好插件卡住的问题',
    result: '查日志、看进程，定位浏览器或电脑控制连不上的原因。',
    sourceLabel: 'X 经验',
    sourceUrl: 'https://x.com/bonitadreama/status/2061086111183585297',
    prompt: '请你作为 Codex 插件故障排查助手，先检查插件状态、日志、后台进程和锁文件，判断为什么 Browser 或 Computer Use 连不上；不要直接结束进程或重启电脑，先说明风险和操作顺序，等我确认。',
  },
  {
    rank: '04',
    tag: '客服跑腿',
    title: '让 Codex 帮你等客服、办退款',
    result: '盯住客服窗口，整理上下文，先写好回复草稿。',
    sourceLabel: 'X 实测',
    sourceUrl: 'https://x.com/jasperdevs/status/2056198503756402808',
    prompt: '请你作为客服跑腿助手，帮我盯住这个客服页面，定时检查是否轮到我；把要回复的话先写成草稿，涉及发送、退款、取消订单或承诺条件时必须先让我确认。',
  },
  {
    rank: '05',
    tag: '网页流程',
    title: '让 Codex 帮你跑网页流程',
    result: '打开网页、理解步骤，先做草稿，关键动作前等你确认。',
    sourceLabel: 'X 实测',
    sourceUrl: 'https://x.com/jesselaunz/status/2052553932090888222',
    prompt: '请你作为网页流程跑腿助手，先只读检查这个网页流程，理解每一步要做什么；可以帮我填写草稿和整理待办，但涉及提交、付款、发送、邀请、删除或发布时必须先让我确认。',
  },
  {
    rank: '06',
    tag: '游戏原型',
    title: '让 Codex 做一个能玩的小游戏',
    result: '把一句玩法或几张图变成浏览器 Demo。',
    sourceLabel: 'X 热帖',
    sourceUrl: 'https://x.com/dkundel/status/2022395036135219580',
    prompt: '请你作为浏览器小游戏导演，先把我的素材或一句话玩法拆成核心循环、胜负条件和操作方式，再实现一个可玩的 Web Demo，并用浏览器试玩找问题。',
  },
  {
    rank: '07',
    tag: '真实 QA',
    title: '让 Codex 检查网页问题',
    result: '自动点击、填表、截图，列出问题和复现步骤。',
    sourceLabel: 'X 经验',
    sourceUrl: 'https://x.com/jeremydevz/status/2059995675752800607',
    prompt: '请你作为本地网页 QA 助手，打开我的本地页面，围绕这次 UI 改动完成真实点击测试；记录 bug、截图位置、复现步骤和建议修复顺序。',
  },
  {
    rank: '08',
    tag: '项目规则',
    title: '让 Codex 写项目说明书',
    result: '把项目规则写清楚，下次开工更快。',
    sourceLabel: 'X 热帖',
    sourceUrl: 'https://x.com/Av1dlive/status/2058588647088406931',
    prompt: '请你作为项目规则整理助手，阅读这个项目的 README、配置文件和常用脚本，生成一份适合 Codex 读取的 AGENTS.md：写清项目目标、运行方式、注意事项、验收标准和不能擅自做的动作。',
  },
  {
    rank: '09',
    tag: 'Skill 工作流',
    title: '给 Codex 装上技能包',
    result: '让常用流程自动触发，少重复解释。',
    sourceLabel: 'X 口碑',
    sourceUrl: 'https://x.com/PaulSolt/status/2040457925743808917',
    prompt: '请你作为 Skill 工作流助手，帮我判断这个任务适合启用哪些 Skill；优先考虑 brainstorming、writing-plans、TDD、code review 这类能降低返工的流程，并告诉我每个 Skill 具体帮我避免什么问题。',
  },
  {
    rank: '10',
    tag: '长任务',
    title: '让 Codex 跑完大任务',
    result: '分阶段推进，只在关键决策时回来问你。',
    sourceLabel: 'X 热帖',
    sourceUrl: 'https://x.com/PaulSolt/status/2057536293408555034',
    prompt: '请你进入长任务模式，以这个目标为准持续推进；先写完成标准和阶段计划，再执行最小可验证步骤，遇到风险、权限、费用或不确定决策时回来问我。',
  },
  {
    rank: '11',
    tag: '代码审查',
    title: '让 Codex 提交前审一遍',
    result: '检查风险、缺失测试和可能的 bug。',
    sourceLabel: 'X 提示词',
    sourceUrl: 'https://x.com/Kostastsale/status/2056829736144490578',
    prompt: '请你作为代码审查助手，先阅读这次改动的 diff，再按 bug 风险、用户影响、缺失测试、可维护性排序列出问题；不要重写代码，先给我审查结论。',
  },
  {
    rank: '12',
    tag: '工具底座',
    title: '让 Codex 稳定调试网页',
    result: '稳定打开页面、读日志、跑 QA。',
    sourceLabel: 'X 视频',
    sourceUrl: 'https://x.com/PovilasKorop/status/2051323727808229758',
    prompt: '请你作为浏览器控制底座搭建助手，为这个项目设计一套稳定的网页调试流程：独立浏览器配置、DevTools 连接、QA 检查项和失败恢复步骤。',
  },
]

export const codexPanelItems = [
  '适合先只读检查，再分步骤执行。',
  '涉及付款、删除、提交和发送时必须停下来确认。',
  '每条案例都带可复制提示词和来源线索。',
]

export const weeklyCards = [
  {
    title: '新案例',
    text: '继续收集真实可复现的 Codex 日常用法，优先选能帮新手立刻省时间的场景。',
  },
  {
    title: '可复现',
    text: '每个案例都要能写成可复制提示词，并且说明哪些动作必须先等用户确认。',
  },
  {
    title: '值得讲',
    text: '只收录能体现 Codex “会用工具、会停下来、会验收”的案例。',
  },
]

export const safetyNotes = [
  {
    title: '真实账户和真实钱',
    text: '提交、付款、退款、下单、发送消息、邀请成员这类动作只让 Codex 准备草稿，最后一步必须人工确认。',
  },
  {
    title: '删除和移动文件',
    text: '清理磁盘、重置配置、结束进程前先让 Codex 只读检查，并列出风险、路径和预计释放空间。',
  },
  {
    title: '长任务先定义完成标准',
    text: '让 Codex 持续推进前，先写清楚完成标准、验收方式和需要回来问你的决策点。',
  },
]
