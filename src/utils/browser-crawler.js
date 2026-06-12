export async function fetchTrendingBrowser(password, onProgress, githubToken = '') {
  const VALID_PASSWORD = '955976'
  if (password !== VALID_PASSWORD) {
    throw new Error('密码错误')
  }

  const headers = {
    'Accept': 'application/vnd.github.v3+json'
  }
  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`
  }

  const allProjects = []
  const seenRepos = new Set()

  const topics = [
    'ai-agents', 'self-hosted', 'esp32', 'webgl', 'home-assistant',
    'raspberry-pi', 'creative-coding', 'rag'
  ]

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i]
    onProgress?.(`正在搜索项目 ${topic}... (${i + 1}/${topics.length})`)

    try {
      const url = `https://api.github.com/search/repositories?q=topic:${topic}&sort=stars&order=desc&per_page=10`
      const res = await fetch(url, { headers })

      if (res.status === 403) {
        const resetTime = res.headers.get('X-RateLimit-Reset')
        const resetDate = resetTime ? new Date(resetTime * 1000).toLocaleTimeString() : '未知'
        throw new Error(`API 速率限制，请${githubToken ? '检查 Token 是否有效' : '提供 GitHub Token'}，重置时间: ${resetDate}`)
      }

      if (!res.ok) continue

      const data = await res.json()

      for (const item of (data.items || [])) {
        if (seenRepos.has(item.full_name)) continue
        seenRepos.add(item.full_name)

        allProjects.push({
          repo: item.full_name,
          name: item.full_name,
          tagline: TAGLINE_ZH[item.full_name] || item.description || '',
          language: item.language || 'Unknown',
          totalStars: item.stargazers_count,
          weeklyStars: 0,
          url: item.html_url,
          topic: topic,
        })
      }

      await new Promise(r => setTimeout(r, 2000))
    } catch (e) {
      if (e.message.includes('速率限制')) throw e
      console.error(`失败: ${topic} - ${e.message}`)
    }
  }

  onProgress?.('正在排序项目...')

  allProjects.sort((a, b) => b.totalStars - a.totalStars)

  const starData = allProjects.slice(0, 50).map((p, i) => ({
    id: `stars-${i + 1}`,
    track: 'stars',
    rank: i + 1,
    source: 'GitHub',
    ...p,
    trendingRank: i + 1,
    mvp: `探索 ${p.name.split('/')[1]} 项目，了解其核心功能和使用场景。`,
    wow: Math.min(95, 70 + Math.floor(Math.random() * 25)),
    useful: Math.min(95, 70 + Math.floor(Math.random() * 25)),
    easy: Math.min(95, 50 + Math.floor(Math.random() * 40)),
    stack: [p.language, `+${p.totalStars} stars`, `Topic: ${p.topic}`],
  }))

  return {
    projects: {
      updatedAt: new Date().toISOString(),
      projects: starData
    }
  }
}

export async function fetchSkillsBrowser(password, onProgress, githubToken = '') {
  const VALID_PASSWORD = '955976'
  if (password !== VALID_PASSWORD) {
    throw new Error('密码错误')
  }

  onProgress?.('正在获取 Skill 数据...')

  // 使用手动维护的准确数据
  const skillsData = [
    { name: 'Superpowers', tagline: '把软件开发方法论、工作流和 agentic skills 打成一套增强包，适合先给 AI 装上"做事方法"。', url: 'https://github.com/obra/superpowers', totalStars: 220300, signal: '含金量最高' },
    { name: 'Anthropic Skills', tagline: 'Claude Skill 的官方公开仓库，适合理解 Skill 的标准写法、触发方式和跨工具复用思路。', url: 'https://github.com/anthropics/skills', totalStars: 147500, signal: '官方生态' },
    { name: 'OpenAI Skills Catalog', tagline: 'Codex 用户最该先看的官方技能目录，用来理解怎么安装、触发和组合 Skill。', url: 'https://github.com/openai/skills', totalStars: 21600, signal: 'Codex 底座' },
    { name: 'Vercel Agent Skills', tagline: '网页项目做完后最需要预览、部署、检查和上线，Vercel 这一套非常适合新手拿结果。', url: 'https://github.com/vercel-labs/agent-skills', totalStars: 27700, signal: '上线必备' },
    { name: 'GitHub CLI', tagline: '让 AI 能更顺地 clone、查 issue、看 release、开 PR 和管理项目来源。', url: 'https://github.com/cli/cli', totalStars: 44700, signal: '复现源码' },
    { name: 'OpenCLI', tagline: '把网站、平台和登录态浏览器变成 AI 能调用的 CLI，适合做资料抓取、网页操作。', url: 'https://github.com/jackwener/OpenCLI', totalStars: 23700, signal: '网页手脚' },
    { name: 'Playwright Skill', tagline: '让 AI 真的打开浏览器测试按钮、输入框、响应式和流程。', url: 'https://github.com/lackeyjb/playwright-skill', totalStars: 2700, signal: '真机验收' },
    { name: 'shadcn/ui Skill', tagline: '做 Web Coding 时最常遇到按钮、表单、弹窗和数据表格，它能让 AI 更稳定地装组件。', url: 'https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/SKILL.md', totalStars: 115900, signal: 'Web 组件' },
    { name: 'headroom', tagline: '把工具输出、日志、文件和 RAG chunk 先压缩再交给 LLM。', url: 'https://github.com/chopratejas/headroom', totalStars: 21400, signal: 'Token 压缩', weeklyStars: 15060 },
    { name: 'hermes-agent', tagline: '会随用户成长的 AI agent，强调长期记忆、工具和自我改进。', url: 'https://github.com/NousResearch/hermes-agent', totalStars: 189600, signal: '长期记忆', weeklyStars: 11915 },
    { name: 'last30days-skill', tagline: '让 agent 跨 Reddit、X、YouTube、HN、Polymarket 和网页做近 30 天研究。', url: 'https://github.com/mvanhorn/last30days-skill', totalStars: 38800, signal: '跨平台研究', weeklyStars: 9307 },
    { name: 'ECC', tagline: '面向 Claude Code、Codex、Opencode、Cursor 等代理的性能优化系统。', url: 'https://github.com/affaan-m/ECC', totalStars: 212400, signal: 'Agent 优化', weeklyStars: 9025 },
    { name: 'markitdown', tagline: '把 PDF、PPT、Word 等文件转换成 Markdown。', url: 'https://github.com/microsoft/markitdown', totalStars: 150000, signal: '文档入口', weeklyStars: 8903 },
    { name: 'taste-skill', tagline: '给 AI 加一份审美判断，适合改善泛化、模板味的文案和视觉说明。', url: 'https://github.com/Leonxlnx/taste-skill', totalStars: 40300, signal: '审美增强', weeklyStars: 7787 },
    { name: 'Agent-Reach', tagline: '给 AI agent 接入 Twitter、Reddit、YouTube、GitHub 等信息源。', url: 'https://github.com/Panniantong/Agent-Reach', totalStars: 25900, signal: '网页研究', weeklyStars: 4361 },
    { name: 'open-notebook', tagline: '开源版 NotebookLM，适合把资料库、笔记、问答和摘要做成自己的知识工作流。', url: 'https://github.com/lfnovo/open-notebook', totalStars: 28800, signal: '知识库', weeklyStars: 4245 },
    { name: 'impeccable', tagline: '面向 AI harness 的设计语言项目，适合让 agent 输出更稳定、更像产品的界面。', url: 'https://github.com/pbakaus/impeccable', totalStars: 37100, signal: '设计语言', weeklyStars: 3334 },
  ]

  const skills = skillsData.map((skill, i) => ({
    id: `skill-${i + 1}`,
    rank: i + 1,
    ...skill,
    category: 'skill'
  }))

  return {
    skills: {
      updatedAt: new Date().toISOString(),
      skills: skills
    }
  }
}

export async function fetchAllBrowser(password, onProgress, githubToken = '') {
  onProgress?.('开始爬取项目数据...')
  const projectsResult = await fetchTrendingBrowser(password, onProgress, githubToken)

  onProgress?.('开始爬取 Skill 数据...')
  const skillsResult = await fetchSkillsBrowser(password, onProgress, githubToken)

  return {
    projects: projectsResult.projects,
    skills: skillsResult.skills
  }
}

const TAGLINE_ZH = {
  "awesome-selfhosted/awesome-selfhosted": "一个免费软件网络服务和 Web 应用的列表，可以部署在自己的服务器上。",
  "affaan-m/ECC": "面向 Claude Code、Codex、Opencode、Cursor 等代理的性能优化系统。",
  "n8n-io/n8n": "公平代码的工作流自动化平台，支持 AI 能力，400+ 集成。",
  "NousResearch/hermes-agent": "一个会随你成长的 AI agent，强调长期记忆、工具和自我改进。",
  "langgenius/dify": "生产级 AI 应用开发平台，支持 RAG、Agent 和工作流。",
  "open-webui/open-webui": "用户友好的 AI 界面，支持 Ollama 和 OpenAI API。",
  "langchain-ai/langchain": "构建 LLM 应用的框架，提供链式调用、代理和工具集成。",
  "firecrawl/firecrawl": "用于搜索、爬取和交互的 API，支持规模化操作。",
  "Shubhamsaboo/awesome-llm-apps": "100+ 个可以实际运行的 AI Agent 和 RAG 应用。",
  "mrdoob/three.js": "JavaScript 3D 图形库。",
  "google-gemini/gemini-cli": "将 Gemini 的能力直接带入终端的开源 AI 代理。",
  "immich-app/immich": "高性能自托管照片和视频管理解决方案。",
  "browser-use/browser-use": "让网站对 AI 代理可访问，自动执行在线任务。",
  "louislam/uptime-kuma": "一个花哨的自托管监控工具。",
  "home-assistant/core": "开源家庭自动化平台，优先本地控制和隐私。",
  "infiniflow/ragflow": "领先的开源 RAG 引擎，融合 RAG 和 Agent 能力。",
  "PaddlePaddle/PaddleOCR": "将任何 PDF 或图像文档转换为结构化数据。",
  "thedotmack/claude-mem": "跨会话持久化上下文，适用于所有 AI 代理。",
  "Stirling-Tools/Stirling-PDF": "GitHub 上排名第一的 PDF 应用，可在任何设备上编辑 PDF。",
  "dair-ai/Prompt-Engineering-Guide": "提示工程、上下文工程、RAG 和 AI Agent 的指南和资源。",
  "ruvnet/RuView": "将普通 WiFi 信号转换为实时空间智能和生命体征监测。",
  "thedaviddias/Front-End-Checklist": "现代 Web 开发的必备清单，适用于人类和 AI 代理。",
  "unslothai/unsloth": "用于训练和运行开源模型的 Web UI。",
  "safishamsi/graphify": "AI 编码助手技能，将代码文件夹转换为可查询的知识图谱。",
  "Mintplex-Labs/anything-llm": "停止租用你的智能，用 AnythingLLM 拥有自己的本地 AI。",
  "usememos/memos": "开源自托管笔记工具，用于快速捕获。",
  "pi-hole/pi-hole": "互联网广告的黑洞。",
  "coollabsio/coolify": "开源自托管 PaaS，Vercel/Heroku/Netlify 的替代品。",
  "appwrite/appwrite": "为 Web、移动和 AI 应用提供完整的云基础设施。",
  "gogs/gogs": "无痛的方式托管自己的 Git 服务。",
  "pixijs/pixijs": "HTML5 创作引擎：用最快的 2D WebGL 渲染器创建美丽的数字内容。",
  "phaserjs/phaser": "Phaser 是一个有趣、免费、快速的 2D 游戏框架。",
  "blakeblackshear/frigate": "具有实时本地对象检测功能的 NVR。",
  "raysan5/raylib": "一个简单易用的视频游戏编程库。",
  "community-scripts/ProxmoxVE": "Proxmox VE 辅助脚本（社区版）。",
  "hwdsl2/setup-ipsec-vpn": "几分钟内设置自己的 IPsec VPN 服务器。",
  "78/xiaozhi-esp32": "一个基于 MCP 的聊天机器人。",
  "GraphiteEditor/Graphite": "社区构建的综合 2D 内容创作应用。",
  "BabylonJS/Babylon.js": "强大、美丽、简单、开放的游戏和渲染引擎。",
  "arendst/Tasmota": "ESP8266 和 ESP32 设备的替代固件。",
  "processing/p5.js": "p5.js 是一个客户端 JS 平台，让艺术家、设计师和学生在网页上学习编程。",
  "MagicMirrorOrg/MagicMirror": "开源模块化智能镜子平台。",
  "XiaoMi/ha_xiaomi_home": "Home Assistant 的小米智能家居集成。",
  "navidrome/navidrome": "你的个人流媒体服务。",
  "jarun/nnn": "非正统的终端文件管理器。",
  "xtermjs/xterm.js": "Web 终端。",
  "mikeroyal/Self-Hosting-Guide": "自托管指南，学习如何本地托管和管理软件应用。",
  "google/filament": "实时基于物理的渲染引擎。",
  "lettier/3d-game-shaders-for-beginners": "3D 游戏着色器的分步实现指南。",
  "tensorflow/tfjs": "用于训练和部署 ML 模型的 WebGL 加速 JavaScript 库。",
}

export function loadTrendingFromStorage() {
  if (typeof localStorage === 'undefined') return null
  try {
    const projects = localStorage.getItem('github-trending')
    const skills = localStorage.getItem('github-skills')
    return {
      projects: projects ? JSON.parse(projects) : null,
      skills: skills ? JSON.parse(skills) : null
    }
  } catch (e) {
    console.error('加载缓存数据失败:', e)
  }
  return null
}
