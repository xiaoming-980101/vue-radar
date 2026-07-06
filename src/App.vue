<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  tracks, starTrack, boardTabs, skillRadarUrl, skillCatalog,
  defaultSkillIds, projectSkillOverrides, projectSkillLimits, projectSkillRules,
  projectGroups, projectTagOverrides, projectTagRules,
  starterOptions, starterGroupLabels, starterGroupHints, starterGroupStyles, starterLabels,
  boardThemes, focusHeaderNotes, focusPalettes,
  projects, formatCount, formatUpdatedDate, projectStack, projectText
} from './data/index.js'
import { githubStarProjects as defaultStarProjects, githubTrendingUpdatedAt as defaultUpdatedAt } from './data/index.js'
import staticSkillsData from './data/skills.json'
import { fetchAllBrowser, fetchTrendingBrowser, loadTrendingFromStorage } from './utils/browser-crawler.js'

const starProjects = ref(defaultStarProjects)
const starUpdatedAt = ref(defaultUpdatedAt)
const fetchedSkills = ref(staticSkillsData.skills ?? [])

onMounted(() => {
  const cached = loadTrendingFromStorage()
  if (cached?.projects?.projects?.length > 0) {
    starProjects.value = cached.projects.projects
    starUpdatedAt.value = new Date(cached.projects.updatedAt)
  } else {
    starProjects.value = defaultStarProjects
    starUpdatedAt.value = defaultUpdatedAt
  }
  if (cached?.skills?.skills?.length > 0) {
    fetchedSkills.value = cached.skills.skills
  }
})

const state = ref({ track: 'all', metric: 'wow', query: '' })
const starterState = ref({ time: 'weekend', goal: 'fun', skill: 'beginner', hardware: 'none' })
const activePlanId = ref(null)
const searchInput = ref(null)
let stopRadar = null

const showFetchDialog = ref(false)
const fetchPassword = ref('')
const fetchGithubToken = ref('')
const fetchStatus = ref('')
const isFetching = ref(false)
const fetchMode = ref('all')

async function doFetch() {
  if (isFetching.value) return
  isFetching.value = true
  fetchStatus.value = '准备爬取...'

  try {
    if (fetchMode.value === 'projects') {
      const result = await fetchTrendingBrowser(fetchPassword.value, (msg) => {
        fetchStatus.value = msg
      }, fetchGithubToken.value)
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('github-trending', JSON.stringify(result.projects))
      }
      starProjects.value = result.projects.projects
      starUpdatedAt.value = new Date(result.projects.updatedAt)
      fetchStatus.value = `成功! ${result.projects.projects.length} 个项目已更新`
    } else if (fetchMode.value === 'skills') {
      const { fetchSkillsBrowser } = await import('./utils/browser-crawler.js')
      const result = await fetchSkillsBrowser(fetchPassword.value, (msg) => {
        fetchStatus.value = msg
      }, fetchGithubToken.value)
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('github-skills', JSON.stringify(result.skills))
      }
      fetchedSkills.value = result.skills.skills
      fetchStatus.value = `成功! ${result.skills.skills.length} 个 Skill 已更新`
    } else {
      const result = await fetchAllBrowser(fetchPassword.value, (msg) => {
        fetchStatus.value = msg
      }, fetchGithubToken.value)
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('github-trending', JSON.stringify(result.projects))
        localStorage.setItem('github-skills', JSON.stringify(result.skills))
      }
      starProjects.value = result.projects.projects
      starUpdatedAt.value = new Date(result.projects.updatedAt)
      fetchedSkills.value = result.skills.skills
      fetchStatus.value = `成功! ${result.projects.projects.length} 个项目 + ${result.skills.skills.length} 个 Skill 已更新`
    }
    setTimeout(() => { showFetchDialog.value = false; fetchStatus.value = ''; fetchPassword.value = '' }, 2000)
  } catch (e) {
    fetchStatus.value = e.message || '爬取失败'
  } finally {
    isFetching.value = false
  }
}

const visibleProjects = computed(() => {
  if (state.value.track === 'stars') {
    return starProjects.value.filter(p => matchesQuery(p)).sort((a, b) => a.rank - b.rank)
  }
  return projects
    .filter(p => state.value.track === 'all' || p.track === state.value.track)
    .filter(p => matchesQuery(p))
    .sort((a, b) => {
      if (state.value.track !== 'all') return a.rank - b.rank
      return trackOrder(a.track) - trackOrder(b.track) || a.rank - b.rank
    })
})

const activeTheme = computed(() => boardThemes[state.value.track] ?? boardThemes.all)

function matchesQuery(project) {
  const haystack = [
    project.name, project.tagline, projectStack(project).join(' '),
    project.mvp, project.source, project.repo ?? '', project.language ?? '',
    project.weeklyStars ? String(project.weeklyStars) : '',
  ].join(' ').toLowerCase()
  return haystack.includes(state.value.query.toLowerCase().trim())
}

function trackOrder(id) { return tracks.findIndex(t => t.id === id) }
function projectsForTrack(trackId) {
  return projects.filter(p => p.track === trackId).filter(p => matchesQuery(p)).sort((a, b) => a.rank - b.rank)
}
function trackById(id) { return boardTabs.find(t => t.id === id) }
function scoreLabel(project) { return project.track === 'stars' ? 'HOT' : 'KIT' }

function recommendedSkillIds(project, limit = 3) {
  const ids = []
  const resultLimit = Math.min(limit, projectSkillLimits[project.name] ?? limit)
  const push = (skillId) => { if (skillCatalog[skillId] && !ids.includes(skillId)) ids.push(skillId) }
  ;(projectSkillOverrides[project.name] ?? []).forEach(push)
  const text = projectText(project)
  projectSkillRules.forEach(rule => {
    if (rule.tracks && !rule.tracks.includes(project.track)) return
    if (rule.match.test(text)) rule.skills.forEach(push)
  })
  ;(defaultSkillIds[project.track] ?? defaultSkillIds.fun).forEach(push)
  return ids.slice(0, resultLimit)
}

function recommendedSkills(project, limit = 3) {
  return recommendedSkillIds(project, limit).map(id => ({ id, ...skillCatalog[id] }))
}

function skillUseReason(project, skill) {
  const sourceName = project.source || project.repo || project.name
  const useCases = {
    'github-cli': `用来 clone / fork「${sourceName}」、查看 README、issue 和 release，优先把原项目或最小示例跑起来。`,
    'opencli': '用来抓取项目文档、配置教程、网页控制台或公开 API，把分散资料变成 AI 可执行的步骤。',
    'playwright-skill': `用来打开浏览器验收「${project.mvp}」里的关键按钮、上传、导出、移动端和重试流程。`,
    'vercel-deploy': '用来把网页 demo 部署成可分享预览链接，并检查构建、环境变量和上线后的基础状态。',
    'frontend-design': '用来按界面准则检查布局、文字溢出、移动端、焦点态和可访问性，让 demo 不只"能跑"也能交给别人用。',
    'shadcn-skill': '用来快速搭出表单、弹窗、设置面板、数据表格等常见 Web App 控件，减少手写低质量 UI。',
    'figma-skills': '用来整理界面结构、组件状态和设计上下文，适合需要设计稿、组件库或视觉对齐的项目。',
    'canva-skills': '用来快速产出封面、海报、社媒图和展示素材，适合视觉成果型项目。',
    'guizang-ppt': '用来把项目结果包装成网页 PPT、发布页或长图说明，适合需要一眼展示效果的项目。',
    'document-skills': '用来处理 PDF、Office、Markdown、OCR、表格和导出文件，适合资料、文档、报表类项目。',
    'supabase-skills': '用来处理登录、数据库表、权限、实时数据和存储，让需要后端状态的应用更快跑通。',
    'huggingface-skills': '用来处理模型、数据集、Gradio 或 Spaces demo，适合需要 AI 模型能力的项目。',
    'sentry-skills': '用来接入错误监控、定位线上异常和修复 issue，适合已经准备公开发布的项目。',
    'lark-cli': '用来把飞书文档、多维表格、会议纪要、日历和任务接进自动化，适合中文团队工作流项目。',
    'openai-skills': '用来查官方 Skill 安装与触发方式，给 Codex 补工具能力；它不是项目依赖，而是开工前的能力目录。',
    'openai-docs': '用来参考模型调用、流式输出、工具调用和结构化输出示例，适合需要接入 LLM 的项目。',
    'agent-skills': '用来给 Codex 补一套工程化执行流程，适合需要稳定读代码、改代码、跑验收的开源项目复现。',
    'skillspector': '用来在安装或复用第三方 Skill 前先扫一遍风险，避免把危险命令和可疑权限直接交给 AI 执行。',
  }
  return useCases[skill.id] ?? skill.description
}

function projectPrimaryUrl(project) {
  return project.demoUrl || project.url || '#'
}

function projectPrimaryActionLabel(project) {
  return project.demoUrl ? '看演示' : '看来源'
}

function projectPrimaryHint(project) {
  return project.demoUrl ? '先体验效果' : (project.source || project.repo || '项目来源')
}

function projectGrowthLabel(project) {
  if (project.weeklyStars > 0) return `本次 +${formatCount(project.weeklyStars)}`
  if (project.totalStars) return `${formatCount(project.totalStars)} total`
  return '等待快照'
}

function projectScale(project) {
  const text = projectText(project)
  let score = 1

  if (project.easy < 52) score += 1.55
  else if (project.easy < 65) score += 1.05
  else if (project.easy < 78) score += 0.55

  if (project.track === 'hardware') score += 1.15
  if (project.track === 'stars') score += 0.45
  if (/docker|compose|k8s|kubernetes|数据库|database|postgres|mysql|redis|supabase|auth|权限|登录/.test(text)) score += 0.65
  if (/llm|rag|agent|openai|模型|gradio|hugging face|tts|voice|语音|大模型/.test(text)) score += 0.55
  if (/gpu|cuda|本地模型|stable diffusion|vtuber|webxr|frigate|coral/.test(text)) score += 0.95
  if (/esp32|raspberry|mqtt|zigbee|固件|烧录|传感器|硬件|3d 打印|lora|sdr/.test(text)) score += 0.75
  if (/webgl|three|canvas|phaser|pixi|p5|音频|音乐|实时|摄像头|hand tracking/.test(text)) score += 0.35
  if (project.easy >= 82) score -= 0.25

  const value = Math.max(1, Math.min(5, Math.round(score * 2) / 2))
  const label = value <= 1.5 ? '轻松跑' : value <= 2.5 ? '有点折腾' : value <= 3.5 ? '需要耐心' : '新手慎入'
  const hint =
    value <= 1.5
      ? '适合直接丢给 AI 开始做，先跑一个最小 demo。'
      : value <= 2.5
        ? '适合新手尝试，但开工前要先确认依赖和账号。'
        : value <= 3.5
          ? '建议让 AI 先做体检，再按最短路径跑通示例。'
          : '先别盲目 clone，最好让 AI 把环境、配置和风险讲清楚再动手。'

  return { value, label, hint, percent: `${Math.round((value / 5) * 100)}%` }
}

function projectVerdict(project) {
  const scale = projectScale(project)
  if (project.easy >= 76 && scale.value <= 2.5) {
    return {
      label: '推荐搓',
      tone: 'good',
      reason: `这个项目反馈比较直接，适合先做出「${project.mvp}」这样的可展示 demo。`,
    }
  }
  if (scale.value >= 4 || project.easy <= 50) {
    return {
      label: '新手慎入',
      tone: 'warn',
      reason: '它很有吸引力，但开工前最好先让 AI 查清依赖、配置和替代方案。',
    }
  }
  return {
    label: '可以试试',
    tone: 'ok',
    reason: '适合用 AI 带着跑，但不要一上来做完整版，先收窄成一个最小可运行效果。',
  }
}

function projectPrepItems(project) {
  const text = projectText(project)
  const items = ['项目链接', '一台电脑']

  if (/llm|rag|agent|openai|模型|大模型|copilot|chat/.test(text)) items.push('API Key 或模型服务')
  if (/docker|compose|open webui|dify|flowise|ragflow|n8n|paperless|immich/.test(text)) items.push('Docker')
  if (/数据库|database|postgres|mysql|redis|supabase|auth|登录|权限/.test(text)) items.push('数据库/账号配置')
  if (/pdf|office|word|excel|ppt|ocr|markdown|文档|票据|合同|发票/.test(text)) items.push('真实文件样本')
  if (/webgl|three|canvas|phaser|pixi|p5|白板|图表|可视化|音频|音乐|摄像头/.test(text)) items.push('现代浏览器')
  if (/esp32|raspberry|mqtt|zigbee|固件|烧录|传感器|硬件|3d 打印|lora|sdr/.test(text)) items.push('硬件配件和数据线')
  if (/网页抓取|crawler|搜索|opencli|飞书|微信|平台|api|rss/.test(text)) items.push('网络/平台账号')
  if (project.track === 'stars') items.push('先读 README')

  return [...new Set(items)].slice(0, 5)
}

function projectRiskItems(project) {
  const text = projectText(project)
  const risks = []

  if (project.easy < 58) risks.push('不要直接做完整版，先让 AI 找到最小可运行入口。')
  if (/llm|rag|agent|openai|模型|大模型|tts|voice|语音/.test(text)) risks.push('可能会卡在 API Key、模型选择或网络访问上。')
  if (/docker|compose|数据库|database|postgres|mysql|redis|supabase/.test(text)) risks.push('可能会卡在环境变量、端口或数据库连接上。')
  if (/esp32|raspberry|mqtt|zigbee|固件|烧录|传感器|硬件|3d 打印|lora|sdr/.test(text)) risks.push('可能会卡在接线、烧录、设备型号或驱动上。')
  if (/webgl|three|canvas|phaser|pixi|p5|webxr|摄像头|音频|音乐/.test(text)) risks.push('可能会卡在浏览器权限、素材路径或实时性能上。')
  if (/pdf|office|ocr|文档|票据|合同|发票|markdown/.test(text)) risks.push('最好准备真实样本，不然 demo 容易只剩空界面。')
  if (!risks.length) risks.push('先跑通原项目或官方示例，再决定要不要二次开发。')

  return [...new Set(risks)].slice(0, 3)
}

function projectExperienceTags(project, limit = 4) {
  const text = projectText(project)
  const overrideTags = projectTagOverrides[project.name] ?? []
  const tags = [...overrideTags]
  if (!overrideTags.length) {
    projectTagRules.forEach(rule => { if (rule.match.test(text)) tags.push(...rule.tags) })
  }
  if (project.weeklyStars) tags.push(`本次 +${formatCount(project.weeklyStars)}`)
  if (tags.length < 2 && project.track === 'fun') tags.push('互动 Demo')
  if (tags.length < 2 && project.track === 'useful') tags.push('真实工作流')
  if (tags.length < 2 && project.track === 'hardware') tags.push('实体反馈')
  if (tags.length < 2 && project.track === 'stars') tags.push('前沿增长')
  if (project.wow >= 90) tags.push('强演示')
  else if (project.wow >= 82) tags.push('效果直观')
  if (project.useful >= 90) tags.push('能进日常')
  else if (project.useful >= 84) tags.push('长期可用')
  if (project.easy >= 78) tags.push('新手友好')
  else if (project.easy <= 55) tags.push('进阶挑战')
  return [...new Set(tags)].slice(0, limit)
}

function recommendationPool() { return [...projects, ...starProjects.value] }
function projectById(id) { return recommendationPool().find(p => p.id === id) }

function starterScore(project) {
  let score = project.easy * 1.05 + project.wow * 0.45 + project.useful * 0.45
  const s = starterState.value
  if (s.time === 'quick') score += project.easy * 0.85
  if (s.time === 'weekend') score += (project.easy + project.wow) * 0.35
  if (s.time === 'week') score += project.useful * 0.55 + project.wow * 0.25
  if (s.goal === 'fun') score += project.wow * 1.05 + (project.track === 'fun' ? 40 : 0)
  if (s.goal === 'useful') score += project.useful * 1.05 + (project.track === 'useful' ? 42 : 0)
  if (s.goal === 'hardware') score += project.track === 'hardware' ? 90 : -35
  if (s.goal === 'frontier') { score += project.track === 'stars' ? 96 : 0; score += project.weeklyStars ? Math.min(46, project.weeklyStars / 420) : 0 }
  if (s.skill === 'beginner') score += project.easy * 0.75
  if (s.skill === 'builder') score += project.useful * 0.35 + project.wow * 0.25
  if (s.skill === 'tinkerer') score += project.wow * 0.45 + (project.track === 'hardware' ? 26 : 0)
  if (s.hardware === 'none' && project.track === 'hardware') score -= 140
  if (s.hardware === 'small' && project.track === 'hardware') score += 28
  if (s.hardware === 'ready' && project.track === 'hardware') score += 62
  if (s.hardware !== 'none' && s.goal !== 'hardware' && project.track === 'hardware') score += 12
  score += Math.max(0, 31 - project.rank) * 0.35
  return score
}

function starterRecommendations() {
  const scored = recommendationPool()
    .map(p => ({ project: p, score: starterScore(p) }))
    .sort((a, b) => b.score - a.score || a.project.rank - b.project.rank)
  const picked = []
  const trackCounts = {}
  for (const item of scored) {
    const track = item.project.track
    if ((trackCounts[track] ?? 0) >= 2) continue
    picked.push(item)
    trackCounts[track] = (trackCounts[track] ?? 0) + 1
    if (picked.length === 3) break
  }
  return picked
}

function starterReason(project) {
  const track = trackById(project.track)
  const timeText = starterLabels.time[starterState.value.time]
  const goalText = starterLabels.goal[starterState.value.goal]
  if (project.track === 'stars') return `适合想"${goalText}"的新手：本次快照新增 +${formatCount(project.weeklyStars)} stars，先复刻一个最小使用场景就能摸到前沿脉搏。`
  if (project.track === 'hardware') return `适合"${timeText}"动手：反馈来自真实设备，按 MVP 做出一个可见/可测的小结果。`
  return `适合"${timeText}"开工：${track.short}方向匹配"${goalText}"，先把 MVP 做成可演示版本。`
}

function syncUrlState() {
  const params = new URLSearchParams()
  if (state.value.track !== 'all') params.set('track', state.value.track)
  if (state.value.metric !== 'wow') params.set('metric', state.value.metric)
  if (state.value.query.trim()) params.set('q', state.value.query.trim())
  const query = params.toString()
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname
  window.history.replaceState(null, '', nextUrl)
}

function hydrateStateFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const track = params.get('track')
  const metric = params.get('metric')
  const query = params.get('q')
  if (track === 'all' || boardTabs.some(item => item.id === track)) state.value.track = track
  if (['wow', 'useful', 'easy'].includes(metric)) state.value.metric = metric
  if (query) state.value.query = query
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function openPlan(projectId) { activePlanId.value = projectId }
function closePlan() { activePlanId.value = null }

const activePlanProject = computed(() => activePlanId.value ? projectById(activePlanId.value) : null)

function buildStarterPlan(project) {
  const track = trackById(project.track)
  const estimate = project.easy >= 78 ? '2-4 小时' : project.easy >= 62 ? '1-2 天' : '3-7 天'
  const sourceName = project.source || project.repo || project.name
  const sourceUrl = project.url || '#'
  const demoUrl = project.demoUrl || ''
  const primaryUrl = projectPrimaryUrl(project)
  const sourceType = sourceUrl.includes('github.com') ? 'GitHub 项目' : '参考项目/官方文档'
  const skills = recommendedSkills(project)
  const scale = projectScale(project)
  const verdict = projectVerdict(project)
  const prepItems = projectPrepItems(project)
  const risks = projectRiskItems(project)
  const skillPromptLines = skills.map((skill, i) => `${i + 1}. ${skill.name}：${skill.url}\n   什么时候用：${skillUseReason(project, skill)}`).join('\n')
  const firstStep = project.track === 'hardware'
    ? '先打开参考项目或官方文档，列出已有设备和需要购买的最小配件，只接一个传感器、灯带、屏幕或控制对象。'
    : project.track === 'stars'
      ? '先阅读 GitHub README 和示例，尽量跑通原项目，再把最有价值的一个功能拆成可复刻的最小 demo。'
      : '先打开参考项目或官方文档，优先复现已有 demo；如果原项目太重，再抽取一个最小网页或脚本。'
  const steps = [
    `先看参考入口：${sourceName}（${sourceUrl}），优先按 README、示例或官方文档跑通一个最小版本。`,
    `如果原项目太重，就只借鉴它最有趣/最实用的核心体验，把演示目标收窄成：${project.mvp}`,
    '准备 1 组真实输入数据或真实设备状态，避免只做空 UI。',
    '加一个保存、导出、分享或重试入口，让 demo 可以交给别人试。',
  ]
  const files = starterFileStructure(project)
  const codexPrompt = [
    '你是 Codex，请帮我判断并复现一个 GitHub / 开源项目。',
    '',
    `项目名称：${project.name}`,
    `项目方向：${track.title}`,
    `项目链接：${sourceUrl}`,
    demoUrl ? `演示入口：${demoUrl}` : '',
    `参考来源：${sourceName}`,
    `我想先做出的效果：${project.mvp}`,
    `建议控制范围：${estimate}`,
    '',
    '请先不要急着写代码，先做一次项目体检：',
    `1. 阅读这个${sourceType}的 README、安装说明、示例和依赖文件。`,
    '2. 基于项目文档和实际依赖，评估它对新手是否值得搓、难度大概在哪里、开工前需要准备什么。',
    '3. 找出最可能卡住的地方，例如 API Key、Docker、数据库、模型、硬件、浏览器权限或网络问题。',
    '4. 如果没有明显硬阻碍，请优先按原项目文档在我电脑上跑起来，不要一上来重写或缩水成简化版。',
    '5. 只有当原项目因为账号、依赖、网络、硬件或服务限制暂时跑不通时，才做保真降级 demo；降级也要保留它最核心、最好玩的玩法和交互。',
    `6. 对这个项目，降级版至少要保留「${project.mvp}」这类核心效果，不能只做一个普通空壳页面。`,
    '7. 遇到报错时，请先定位原因，再给出修复方案，不要盲目重装。',
    '',
    '可参考的 Skill / 工具链接：',
    skillPromptLines,
  ].filter(Boolean).join('\n')
  return {
    estimate,
    firstStep,
    steps,
    files,
    sourceName,
    sourceUrl,
    demoUrl,
    primaryUrl,
    skills,
    scale,
    verdict,
    prepItems,
    risks,
    codexPrompt,
  }
}

function starterFileStructure(project) {
  if (project.track === 'hardware') return ['README.md', 'firmware/main.yaml', 'dashboard/index.html', 'parts-list.md']
  if (project.track === 'stars') return ['README.md', 'src/index.js', 'examples/demo-input.md', 'notes/replicate-plan.md']
  if (projectStack(project).some(item => /Three|WebGL|Canvas|Phaser|p5|Pixi/i.test(item))) return ['index.html', 'src/main.js', 'src/scene.js', 'src/styles.css']
  return ['index.html', 'src/main.js', 'src/components.js', 'src/styles.css']
}

function skillBundleMarkdown(project) {
  const plan = buildStarterPlan(project)
  const skillLines = plan.skills.map((skill, i) =>
    `${i + 1}. [${skill.name}](${skill.url})\n   - 在这个项目里的用法：${skillUseReason(project, skill)}\n   - 推荐理由：${skill.signal}`
  ).join('\n')
  return [
    `# ${project.name} · Skill 开工清单`, '',
    `项目来源：${plan.sourceName}`,
    `项目链接：${plan.sourceUrl}`,
    plan.demoUrl ? `演示入口：${plan.demoUrl}` : '',
    `预计用时：${plan.estimate}`,
    `开工判断：${plan.verdict.label}，${plan.scale.label}`,
    '',
    '## 开工前检查',
    `先准备：${plan.prepItems.join('、')}`,
    `可能卡点：${plan.risks.join('；')}`,
    '',
    '## 推荐使用的 Skill', skillLines, '',
    '## 复制给 Codex 的 Prompt', '', '```text', plan.codexPrompt, '```', '',
    '## 使用方式',
    '1. 先打开项目链接，确认 README、示例和依赖是否适合直接复现。',
    '2. 把上面的 Skill 链接和 Prompt 一起交给 Codex、Claude Code 或 Cursor。',
    '3. 如果当前环境不能安装某个 Skill，就让 AI 阅读对应链接后模拟同样的工作流执行。',
  ].join('\n')
}

function safeDownloadName(value) {
  return String(value).trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').slice(0, 72)
}

function downloadSkillBundle(project) {
  const markdown = skillBundleMarkdown(project)
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${safeDownloadName(project.name)}-skill-kit.md`
  document.body.append(link)
  link.click()
  window.setTimeout(() => { URL.revokeObjectURL(url); link.remove() }, 0)
}

async function copyPlanPrompt(event) {
  const plan = buildStarterPlan(activePlanProject.value)
  const prompt = plan.codexPrompt
  event.currentTarget.textContent = '已复制'
  try { await navigator.clipboard.writeText(prompt) } catch {
    const fallback = document.createElement('textarea')
    fallback.value = prompt
    fallback.style.position = 'fixed'
    fallback.style.opacity = '0'
    document.body.append(fallback)
    fallback.select()
    document.execCommand('copy')
    fallback.remove()
  }
  window.setTimeout(() => { event.currentTarget.textContent = '复制 Prompt' }, 1600)
}

function setTrack(trackId) {
  state.value.track = trackId
  syncUrlState()
  nextTick(() => {
    document.querySelector('#board')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

const isSearchComposing = ref(false)
const searchRenderTimer = ref(null)

function scheduleSearchRender(delay = 320) {
  if (searchRenderTimer.value) clearTimeout(searchRenderTimer.value)
  searchRenderTimer.value = setTimeout(() => {
    searchRenderTimer.value = null
    if (isSearchComposing.value) return
    syncUrlState()
  }, delay)
}

function onSearchInput(event) {
  state.value.query = event.target.value
  if (isSearchComposing.value || event.isComposing || event.inputType === 'insertCompositionText') return
  scheduleSearchRender()
}

function onSearchCompositionStart() {
  isSearchComposing.value = true
  if (searchRenderTimer.value) clearTimeout(searchRenderTimer.value)
}

function onSearchCompositionEnd(event) {
  isSearchComposing.value = false
  state.value.query = event.target.value
  scheduleSearchRender(120)
}

function startRadar() {
  const canvas = document.querySelector('#radarCanvas')
  if (!canvas) return null
  const context = canvas.getContext('2d')
  const colors = ['#225CFF', '#18A058', '#FF6A3D', '#111827']
  let frame = 0, width = 0, height = 0, points = [], frameId = 0
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function resize() {
    const ratio = window.devicePixelRatio || 1
    width = canvas.clientWidth; height = canvas.clientHeight
    canvas.width = width * ratio; canvas.height = height * ratio
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    points = Array.from({ length: Math.max(22, Math.floor(width / 45)) }, (_, i) => ({
      x: (i * 97) % Math.max(width, 1), y: 80 + ((i * 139) % Math.max(height - 120, 1)),
      r: 2 + (i % 5), c: colors[i % colors.length], speed: 0.25 + (i % 4) * 0.08,
    }))
  }

  function draw() {
    frame += 0.012
    context.clearRect(0, 0, width, height)
    const gradient = context.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, 'rgba(255,255,255,0.92)')
    gradient.addColorStop(0.45, 'rgba(242,247,255,0.82)')
    gradient.addColorStop(1, 'rgba(246,248,251,0.96)')
    context.fillStyle = gradient
    context.fillRect(0, 0, width, height)
    context.strokeStyle = 'rgba(20, 29, 45, 0.07)'
    context.lineWidth = 1
    for (let x = 0; x < width; x += 52) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke() }
    for (let y = 0; y < height; y += 52) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke() }
    const moved = points.map((p, i) => ({ ...p, x: (p.x + Math.cos(frame + i) * 16 + width) % width, y: p.y + Math.sin(frame * p.speed + i * 0.8) * 18 }))
    moved.forEach((a, i) => { moved.slice(i + 1, i + 4).forEach(b => { const d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 210) { context.globalAlpha = 0.16; context.strokeStyle = a.c; context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke() } }) })
    context.globalAlpha = 1
    moved.forEach(p => { context.fillStyle = p.c; context.beginPath(); context.arc(p.x, p.y, p.r, 0, Math.PI * 2); context.fill(); context.strokeStyle = 'rgba(255,255,255,0.8)'; context.stroke() })
    if (!reduceMotion) frameId = requestAnimationFrame(draw)
  }

  resize(); draw()
  window.addEventListener('resize', resize, { passive: true })
  return () => { cancelAnimationFrame(frameId); window.removeEventListener('resize', resize) }
}

onMounted(() => {
  hydrateStateFromUrl()
  nextTick(() => { stopRadar = startRadar() })
})

onUnmounted(() => { if (stopRadar) stopRadar() })
</script>

<template>
  <div class="skip-link-wrapper">
    <a class="skip-link" href="#board">跳到榜单</a>
  </div>
  <main id="app">
    <section class="hero" aria-label="Vibe Coding 雷达简介">
      <canvas class="radar-canvas" id="radarCanvas" aria-hidden="true"></canvas>
      <div class="hero-shell">
        <header class="topbar">
          <a class="brand" href="#top" aria-label="Vibe Coding 雷达">
            <span class="brand-mark"></span>
            <span>Vibe Coding 雷达</span>
          </a>
          <nav class="topnav" aria-label="榜单分组">
            <button v-for="track in boardTabs" :key="track.id"
              class="nav-pill" :class="{ active: state.track === track.id }"
              @click="setTrack(track.id)">{{ track.nav ?? track.short }}</button>
            <a class="nav-pill nav-pill-link nav-pill-skill" :href="skillRadarUrl">必装 Skill</a>
          </nav>
        </header>

        <div class="hero-grid" id="top">
          <div class="hero-copy">
            <p class="kicker">Beginner-friendly project board · 更新 {{ formatUpdatedDate(starUpdatedAt) }}</p>
            <h1><span>Vibe Coding</span><span>雷达</span></h1>
            <p class="hero-lede">
              给刚开始 Coding 的新手，把好玩、好用、好搓（硬件）三条路线整理成一张 90 项可分享榜单：
              每个项目都有 MVP、体验标签、参考来源和三维评分。现在还能按时间、目标和经验生成适合你的开工清单。
            </p>
            <div class="hero-actions">
              <a class="primary-link" href="#starter">适合我的项目</a>
              <a class="secondary-link" href="#board">查看榜单</a>
              <a class="secondary-link" href="#star-projects">明星项目</a>
              <a class="secondary-link" :href="skillRadarUrl">必装 Skill</a>
            </div>
          </div>
          <aside class="hero-panel" aria-label="榜单概览">
            <div class="panel-head"><span>Selection Index</span><strong>{{ projects.length }}</strong></div>
            <div class="metric-grid">
              <div><span>Tracks</span><strong>3+1</strong></div>
              <div><span>Top score</span><strong>98</strong></div>
              <div><span>MVP span</span><strong>1-7d</strong></div>
              <div><span>Rising</span><strong>{{ starProjects.length }}</strong></div>
            </div>
            <div class="priority-strip">
              <span style="--size: 97%"></span>
              <span style="--size: 91%"></span>
              <span style="--size: 88%"></span>
            </div>
          </aside>
        </div>
      </div>
    </section>

    <section class="star-band" id="star-projects">
      <div class="section-shell star-shell">
        <div class="star-showcase-head">
          <div>
            <p class="section-kicker">Rising This Week</p>
            <h2>明星项目</h2>
            <p>来自 GitHub Search topic 池和本地快照的开源项目；有历史快照时显示本次新增 stars，没有快照时显示总 stars。</p>
          </div>
          <div class="star-actions">
            <button class="star-tab-button" type="button" @click="setTrack('stars')">增长最快的 GitHub 项目</button>
            <a href="https://github.com/trending?since=weekly" target="_blank" rel="noreferrer">查看 GitHub 源</a>
          </div>
        </div>
        <div class="star-showcase-grid" aria-label="明星项目展示">
          <template v-if="starProjects.length > 0">
            <a class="star-card star-card-lead" :href="starProjects[0].url" target="_blank" rel="noreferrer">
              <div class="star-card-top"><span>#1</span><em>{{ projectGrowthLabel(starProjects[0]) }}</em></div>
              <strong>{{ starProjects[0].name }}</strong>
              <p>{{ starProjects[0].tagline }}</p>
              <div class="star-card-meta">
                <span v-for="tag in projectExperienceTags(starProjects[0], 3)" :key="tag">{{ tag }}</span>
              </div>
            </a>
            <div class="star-mini-grid">
              <a v-for="p in starProjects.slice(1, 6)" :key="p.id" class="star-card" :href="p.url" target="_blank" rel="noreferrer">
              <div class="star-card-top"><span>#{{ p.rank }}</span><em>{{ projectGrowthLabel(p) }}</em></div>
              <strong>{{ p.name }}</strong>
              <p>{{ p.tagline }}</p>
              <div class="star-card-meta">
                <span v-for="tag in projectExperienceTags(p, 3)" :key="tag">{{ tag }}</span>
              </div>
            </a>
          </div>
          </template>
        </div>
      </div>
    </section>

    <section class="section-shell starter-section" id="starter">
      <div class="starter-head">
        <div>
          <p class="section-kicker">Starter Picker</p>
          <h2>先挑 3 个最适合你开工的项目</h2>
        </div>
        <p>选一下时间、目标和硬件意愿，雷达会从 {{ recommendationPool().length }} 个候选里给出 3 个更适合现在动手的项目。</p>
      </div>
      <div class="starter-layout">
        <div class="starter-picker" aria-label="新手项目选择器">
          <div class="starter-orb-wrap">
            <div class="starter-orb" role="group" aria-label="气泡标签选择器">
              <div class="starter-orb-core"><span>4 组气泡</span><strong>实时推荐</strong></div>
              <section v-for="(options, key) in starterOptions" :key="key"
                class="starter-tag-zone" :class="`starter-tag-zone-${key}`"
                :style="{
                  '--zone-x': starterGroupStyles[key].x + '%', '--zone-y': starterGroupStyles[key].y + '%',
                  '--zone-width': starterGroupStyles[key].width + '%', '--zone-height': starterGroupStyles[key].height + '%',
                  '--head-x': starterGroupStyles[key].label.x + '%', '--head-y': starterGroupStyles[key].label.y + '%',
                  '--zone-tone': starterGroupStyles[key].tone,
                }"
                :aria-label="starterGroupLabels[key] + '选项'">
                <div class="starter-zone-head">
                  <strong>{{ starterGroupLabels[key] }}</strong>
                  <span>{{ starterGroupHints[key] }}</span>
                </div>
                <button v-for="(option, idx) in options" :key="option.id"
                  type="button" class="starter-tag" :class="{ active: starterState[key] === option.id }"
                  :style="{
                    '--tag-x': starterGroupStyles[key].positions[idx % starterGroupStyles[key].positions.length].x + '%',
                    '--tag-y': starterGroupStyles[key].positions[idx % starterGroupStyles[key].positions.length].y + '%',
                    '--tag-tone': starterGroupStyles[key].tone,
                  }"
                  @click="starterState[key] = option.id; nextTick(() => document.querySelector('#starter')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))"
                  :aria-pressed="starterState[key] === option.id"
                  :aria-label="starterGroupLabels[key] + '：' + option.label + '。' + option.description">
                  <span class="starter-tag-bubble"><strong>{{ option.label }}</strong></span>
                </button>
              </section>
            </div>
            <div class="starter-active-tags" aria-label="已选标签">
              <span v-for="(value, key) in starterState" :key="key">
                <em>{{ starterGroupLabels[key] }}</em>
                <strong>{{ starterLabels[key][value] }}</strong>
              </span>
            </div>
          </div>
        </div>
        <div class="starter-results" aria-live="polite">
          <article v-for="({ project, score }, index) in starterRecommendations()" :key="project.id"
            class="starter-result-card" :style="{ '--track': trackById(project.track).accent }">
            <div class="starter-result-top">
              <span>#{{ index + 1 }}</span>
              <em>{{ trackById(project.track).title }}</em>
              <strong>{{ Math.round(score) }}</strong>
            </div>
            <h3>{{ project.name }}</h3>
            <p>{{ starterReason(project) }}</p>
            <div class="feature-list">
              <span v-for="tag in projectExperienceTags(project, 3)" :key="tag">{{ tag }}</span>
            </div>
            <div class="starter-result-actions">
              <button type="button" class="plan-button action-tile" @click="openPlan(project.id)">
                <span>生成开工计划</span><em>步骤 + Prompt</em>
              </button>
              <a class="source-link action-tile" :href="projectPrimaryUrl(project)" target="_blank" rel="noreferrer">
                <span>{{ projectPrimaryActionLabel(project) }}</span><em>{{ projectPrimaryHint(project) }}</em>
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="section-shell board-shell" :class="state.track !== 'all' ? `board-focus board-${state.track}` : 'board-all'"
      id="board"
      :style="{ '--mode-primary': activeTheme.primary, '--mode-soft': activeTheme.soft, '--mode-shadow': activeTheme.shadow }">
      <div class="control-row">
        <div><p class="section-kicker">Project Board</p><h2>按你的目标挑项目</h2></div>
        <div class="controls" aria-label="榜单筛选">
          <div class="segmented" role="tablist" aria-label="分组">
            <button data-filter="all" :class="{ active: state.track === 'all' }" @click="setTrack('all')">全部</button>
            <button v-for="track in boardTabs" :key="track.id"
              :data-filter="track.id" :class="{ active: state.track === track.id }"
              @click="setTrack(track.id)">{{ track.nav ?? track.short }}</button>
          </div>
          <label class="search-field">
            <span>Search</span>
            <input ref="searchInput" id="searchInput" name="project-search" autocomplete="off" type="search"
              :value="state.query" placeholder="搜 AI、ESP32、财务…"
              @input="onSearchInput"
              @compositionstart="onSearchCompositionStart"
              @compositionend="onSearchCompositionEnd" />
          </label>
          <div class="rank-mode" :aria-label="state.track === 'all' ? '全品类分列' : '当前榜单顺序'">
            <template v-if="state.track === 'all'"><span>Layout</span><strong>三列分榜</strong></template>
            <template v-else><span>Order</span><strong>1 → {{ visibleProjects.length }}</strong></template>
          </div>
        </div>
      </div>

      <template v-if="state.track !== 'all'">
        <div class="track-focus-head" :style="{ '--track': trackById(state.track).accent }">
          <div class="focus-mark"><span>{{ trackById(state.track).eyebrow }}</span><strong>{{ trackById(state.track).short }}</strong></div>
          <div class="focus-copy"><h3>{{ trackById(state.track).title }}</h3><p>{{ trackById(state.track).summary }}</p></div>
          <div class="focus-notes">
            <span v-for="note in focusHeaderNotes[state.track]" :key="note">{{ note }}</span>
          </div>
          <div class="focus-count" aria-label="当前榜单顺序"><span>Order</span><strong>#1 → #{{ visibleProjects.length }}</strong></div>
        </div>
      </template>
      <template v-else>
        <div class="track-overview-head" aria-label="分类导览">
          <section v-for="(track, idx) in tracks" :key="track.id"
            class="track-overview-head-cell" :style="{ '--track': track.accent }" :aria-label="track.title">
            <div class="track-overview-meta">
              <span class="track-index">0{{ idx + 1 }}</span>
              <span class="track-eyebrow">{{ track.eyebrow }}</span>
              <em>#1 → #{{ projectsForTrack(track.id).length }}</em>
            </div>
            <strong>{{ track.title }}</strong>
            <p>{{ track.summary }}</p>
          </section>
        </div>
      </template>

      <template v-if="state.track === 'all'">
        <div class="project-columns" aria-live="polite">
          <section v-for="track in tracks" :key="track.id"
            class="project-column" :style="{ '--track': track.accent }" :aria-label="track.title">
            <div class="project-column-head">
              <span>{{ track.eyebrow }}</span><strong>{{ track.title }}</strong>
              <em>#1 → #{{ projectsForTrack(track.id).length }}</em>
            </div>
            <div class="project-column-list">
              <template v-if="projectsForTrack(track.id).length">
                <article v-for="(project, idx) in projectsForTrack(track.id)" :key="project.id"
                  class="project-card project-card-compact" :style="{ '--track': trackById(project.track).accent }">
                  <div class="card-topline">
                    <span class="rank">#{{ project.rank }}</span>
                    <span class="track-label">{{ trackById(project.track).title }}</span>
                    <span class="grade">{{ scoreLabel(project) }}</span>
                  </div>
                  <h3>{{ project.name }}</h3>
                  <p class="tagline">{{ project.tagline }}</p>
                  <div class="feature-list"><span v-for="tag in projectExperienceTags(project, 3)" :key="tag">{{ tag }}</span></div>
                  <div class="mvp"><span>演示</span><p>{{ project.mvp }}</p></div>
                  <div class="skill-kit">
                    <div class="skill-kit-head"><span>推荐开工 Skill</span><a class="skill-kit-radar-link" :href="skillRadarUrl">完整榜单</a></div>
                    <div class="skill-chip-list">
                      <a v-for="skill in recommendedSkills(project, 2)" :key="skill.id" class="skill-chip" :href="skill.url" target="_blank" rel="noreferrer">
                        <strong>{{ skill.name }}</strong><em>{{ skill.signal }}</em>
                      </a>
                    </div>
                  </div>
                  <footer class="card-footer">
                    <div class="card-stat"><span>Skills</span><strong>{{ recommendedSkills(project, 2).length }} 个</strong></div>
                    <div class="card-actions">
                      <button type="button" class="plan-button action-tile" @click="openPlan(project.id)">
                        <span>带 Skill 开工</span><em>Prompt + links</em>
                      </button>
                      <a class="source-link action-tile" :href="projectPrimaryUrl(project)" target="_blank" rel="noreferrer">
                        <span>{{ projectPrimaryActionLabel(project) }}</span><em>{{ projectPrimaryHint(project) }}</em>
                      </a>
                    </div>
                  </footer>
                </article>
              </template>
              <template v-else><div class="empty-column">暂无匹配项目</div></template>
            </div>
          </section>
        </div>
      </template>
      <template v-else>
        <div class="project-grid" aria-live="polite">
          <article v-for="(project, index) in visibleProjects" :key="project.id"
            class="project-card" :class="{ 'project-card-star': project.track === 'stars' }"
            :style="{ '--track': trackById(project.track).accent }">
            <div class="card-topline">
              <span class="rank">#{{ index + 1 }}</span>
              <span class="track-label">{{ trackById(project.track).title }}</span>
              <span class="grade">{{ scoreLabel(project) }}</span>
            </div>
            <h3>{{ project.name }}</h3>
            <p class="tagline">{{ project.tagline }}</p>
            <div class="feature-list"><span v-for="tag in projectExperienceTags(project, 5)" :key="tag">{{ tag }}</span></div>
            <div class="mvp"><span>MVP</span><p>{{ project.mvp }}</p></div>
            <div class="skill-kit">
              <div class="skill-kit-head"><span>推荐开工 Skill</span><a class="skill-kit-radar-link" :href="skillRadarUrl">完整榜单</a></div>
              <div class="skill-chip-list">
                <a v-for="skill in recommendedSkills(project)" :key="skill.id" class="skill-chip" :href="skill.url" target="_blank" rel="noreferrer">
                  <strong>{{ skill.name }}</strong><em>{{ skill.signal }}</em>
                </a>
              </div>
            </div>
            <footer class="card-footer">
              <div class="card-stat">
                <span>{{ project.track === 'stars' ? 'Growth' : 'Skills' }}</span>
                <strong>{{ project.track === 'stars' ? projectGrowthLabel(project) : recommendedSkills(project).length + ' 个' }}</strong>
              </div>
              <div class="card-actions">
                <button type="button" class="plan-button action-tile" @click="openPlan(project.id)">
                  <span>带 Skill 开工</span><em>Prompt + links</em>
                </button>
                <a class="source-link action-tile" :href="projectPrimaryUrl(project)" target="_blank" rel="noreferrer">
                  <span>{{ projectPrimaryActionLabel(project) }}</span><em>{{ projectPrimaryHint(project) }}</em>
                </a>
              </div>
            </footer>
          </article>
        </div>
      </template>
    </section>

    <button class="fab-fetch" @click="showFetchDialog = true" title="更新 GitHub 数据">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 11-6.219-8.56"></path>
        <path d="M21 3v5h-5"></path>
      </svg>
    </button>

    <div v-if="showFetchDialog" class="fetch-dialog-shell">
      <div class="fetch-backdrop" @click="showFetchDialog = false"></div>
      <div class="fetch-dialog">
        <h3>更新数据</h3>
        <p>输入密码后点击爬取，从 GitHub 抓取最新数据。</p>
        <input type="password" v-model="fetchPassword" placeholder="请输入密码" autocomplete="new-password" @keyup.enter="doFetch" />
        <input type="text" v-model="fetchGithubToken" placeholder="GitHub Token（可选，提高速率限制）" autocomplete="off" style="margin-top: 8px;" />
        <div class="fetch-mode-select">
          <label :class="{ active: fetchMode === 'all' }">
            <input type="radio" v-model="fetchMode" value="all" /> 全部
          </label>
          <label :class="{ active: fetchMode === 'projects' }">
            <input type="radio" v-model="fetchMode" value="projects" /> 仅项目
          </label>
          <label :class="{ active: fetchMode === 'skills' }">
            <input type="radio" v-model="fetchMode" value="skills" /> 仅 Skill
          </label>
        </div>
        <div class="fetch-hint">GitHub Search API 未登录额度很低，建议填 Token；抓取结果会先存在本机浏览器缓存。</div>
        <div class="fetch-status" v-if="fetchStatus">{{ fetchStatus }}</div>
        <div class="fetch-actions">
          <button type="button" class="fetch-cancel" @click="showFetchDialog = false">取消</button>
          <button type="button" class="fetch-confirm" @click="doFetch" :disabled="isFetching || !fetchPassword">
            {{ isFetching ? '爬取中...' : '开始爬取' }}
          </button>
        </div>
      </div>
    </div>

    <section class="section-shell source-section" id="sources">
      <div><p class="section-kicker">Reference</p><h2>发现渠道</h2></div>
      <div class="source-grid">
        <a v-for="link in [
          { text: 'GitHub · creative-coding topic', url: 'https://github.com/topics/creative-coding' },
          { text: 'GitHub · game-development topic', url: 'https://github.com/topics/game-development' },
          { text: 'GitHub · WebGL topic', url: 'https://github.com/topics/webgl' },
          { text: 'GitHub · Canvas topic', url: 'https://github.com/topics/canvas' },
          { text: 'GitHub · Web Audio topic', url: 'https://github.com/topics/web-audio' },
          { text: 'GitHub · self-hosted topic', url: 'https://github.com/topics/self-hosted' },
          { text: 'GitHub · AI agents topic', url: 'https://github.com/topics/ai-agents' },
          { text: 'GitHub · RAG topic', url: 'https://github.com/topics/rag' },
          { text: 'GitHub · ESP32 topic', url: 'https://github.com/topics/esp32' },
          { text: 'GitHub · Raspberry Pi topic', url: 'https://github.com/topics/raspberry-pi' },
          { text: 'GitHub · home-automation topic', url: 'https://github.com/topics/home-automation' },
          { text: 'GitHub · 3D printing topic', url: 'https://github.com/topics/3d-printing' },
          { text: 'GitHub · Home Assistant topic', url: 'https://github.com/topics/home-assistant' },
          { text: 'Awesome · self-hosted list', url: 'https://github.com/awesome-selfhosted/awesome-selfhosted' },
          { text: 'GitHub · Trending weekly', url: 'https://github.com/trending?since=weekly' },
        ]" :key="link.url" :href="link.url" target="_blank" rel="noreferrer">{{ link.text }}</a>
      </div>
    </section>

    <section v-if="fetchedSkills.length > 0" class="section-shell fetched-skills-section" id="fetched-skills">
      <div>
        <p class="section-kicker">Skill Radar</p>
        <h2>推荐 Skill 数据</h2>
        <p>默认使用仓库内置的最新快照；手动刷新后会优先展示浏览器缓存里的 GitHub 数据。</p>
      </div>
      <div class="fetched-skills-grid">
        <a v-for="skill in fetchedSkills.slice(0, 12)" :key="skill.id" class="fetched-skill-card" :href="skill.url" target="_blank" rel="noreferrer">
          <div class="skill-card-top">
            <span class="skill-rank">#{{ skill.rank }}</span>
            <span class="skill-stars">{{ formatCount(skill.totalStars) }} stars</span>
          </div>
          <h3>{{ skill.name }}</h3>
          <p>{{ skill.tagline }}</p>
        </a>
      </div>
    </section>

    <div v-if="activePlanProject" class="plan-dialog-shell">
      <div class="plan-backdrop" @click="closePlan"></div>
      <section class="plan-dialog" role="dialog" aria-modal="true" tabindex="-1"
        :style="{ '--track': trackById(activePlanProject.track).accent }">
        <header class="plan-dialog-head">
          <div>
            <p class="section-kicker">Start Plan</p>
            <h2>{{ escapeHtml(activePlanProject.name) }}</h2>
            <p>{{ escapeHtml(activePlanProject.tagline) }}</p>
          </div>
          <div class="plan-dialog-controls">
            <button type="button" class="copy-plan plan-copy-top" @click="copyPlanPrompt">复制 Prompt</button>
            <a class="plan-header-source" :href="buildStarterPlan(activePlanProject).primaryUrl" target="_blank" rel="noreferrer">
              {{ buildStarterPlan(activePlanProject).demoUrl ? '打开演示入口' : '打开项目来源' }}
            </a>
            <button type="button" class="plan-close" @click="closePlan" aria-label="关闭开工计划">×</button>
          </div>
        </header>
        <div class="plan-overview">
          <div class="plan-meta">
            <span>{{ trackById(activePlanProject.track).title }}</span>
            <span>预计 {{ buildStarterPlan(activePlanProject).estimate }}</span>
            <span>{{ buildStarterPlan(activePlanProject).verdict.label }}</span>
            <span>Scale {{ buildStarterPlan(activePlanProject).scale.value }}/5</span>
            <span v-for="tag in projectExperienceTags(activePlanProject, 2)" :key="tag">{{ tag }}</span>
          </div>
          <a class="plan-source-card" :href="buildStarterPlan(activePlanProject).primaryUrl" target="_blank" rel="noreferrer">
            <span>{{ buildStarterPlan(activePlanProject).demoUrl ? '演示优先' : '推荐项目入口' }}</span>
            <strong>{{ escapeHtml(buildStarterPlan(activePlanProject).sourceName) }}</strong>
            <em>{{ escapeHtml(buildStarterPlan(activePlanProject).primaryUrl) }}</em>
          </a>
        </div>
        <div class="plan-diagnosis">
          <section class="plan-verdict-card" :class="`plan-verdict-${buildStarterPlan(activePlanProject).verdict.tone}`">
            <span>值不值得搓</span>
            <strong>{{ buildStarterPlan(activePlanProject).verdict.label }}</strong>
            <p>{{ escapeHtml(buildStarterPlan(activePlanProject).verdict.reason) }}</p>
          </section>
          <section class="plan-scale-card">
            <div>
              <span>难不难</span>
              <strong>Scale {{ buildStarterPlan(activePlanProject).scale.value }}/5</strong>
            </div>
            <div class="plan-scale-meter" :aria-label="`项目难度 Scale ${buildStarterPlan(activePlanProject).scale.value}/5`">
              <i :style="{ width: buildStarterPlan(activePlanProject).scale.percent }"></i>
            </div>
            <p>{{ buildStarterPlan(activePlanProject).scale.label }}：{{ buildStarterPlan(activePlanProject).scale.hint }}</p>
          </section>
          <section class="plan-prep-card">
            <span>先准备什么</span>
            <div class="plan-prep-list">
              <em v-for="item in buildStarterPlan(activePlanProject).prepItems" :key="item">{{ item }}</em>
            </div>
          </section>
        </div>
        <div class="plan-grid">
          <section class="plan-block plan-demo-block">
            <h3>先做这个效果</h3>
            <p>{{ escapeHtml(activePlanProject.mvp) }}</p>
          </section>
          <section class="plan-block plan-risk-block">
            <h3>可能会卡在这里</h3>
            <ul class="plan-list">
              <li v-for="risk in buildStarterPlan(activePlanProject).risks" :key="risk">{{ risk }}</li>
            </ul>
          </section>
          <a v-if="buildStarterPlan(activePlanProject).demoUrl"
            class="plan-source-card plan-demo-link-card"
            :href="buildStarterPlan(activePlanProject).demoUrl" target="_blank" rel="noreferrer">
            <span>演示入口</span>
            <strong>先看能不能跑出效果</strong>
            <em>{{ escapeHtml(buildStarterPlan(activePlanProject).demoUrl) }}</em>
          </a>
          <section class="plan-block">
            <h3>第一步</h3>
            <p>{{ escapeHtml(buildStarterPlan(activePlanProject).firstStep) }}</p>
          </section>
          <section class="plan-block">
            <h3>4 步 MVP</h3>
            <ol class="plan-list">
              <li v-for="(step, i) in buildStarterPlan(activePlanProject).steps" :key="i">{{ escapeHtml(step) }}</li>
            </ol>
          </section>
          <section class="plan-block">
            <h3>建议文件结构</h3>
            <ul class="plan-file-list">
              <li v-for="(file, i) in buildStarterPlan(activePlanProject).files" :key="i">{{ escapeHtml(file) }}</li>
            </ul>
          </section>
          <section class="plan-block plan-skill-block">
            <div class="plan-block-head">
              <h3>推荐开工 Skill</h3>
              <div class="plan-head-actions">
                <a class="skill-radar-button" :href="skillRadarUrl">完整榜单</a>
                <button type="button" class="download-skills" @click="downloadSkillBundle(activePlanProject)">下载清单</button>
              </div>
            </div>
            <p>把这些 Skill / CLI 和项目链接一起交给 AI，它就能更像"带着手和脚"开工。</p>
            <div class="plan-skill-list">
              <a v-for="skill in buildStarterPlan(activePlanProject).skills" :key="skill.id"
                :href="escapeHtml(skill.url)" target="_blank" rel="noreferrer">
                <strong>{{ escapeHtml(skill.name) }}</strong>
                <span>{{ escapeHtml(skillUseReason(activePlanProject, skill)) }}</span>
              </a>
            </div>
          </section>
          <section class="plan-block plan-prompt-block">
            <div class="plan-block-head">
              <h3>复制给 Codex（含 GitHub / 项目链接）</h3>
              <button type="button" class="copy-plan" @click="copyPlanPrompt">复制 Prompt</button>
            </div>
            <pre id="planPrompt">{{ escapeHtml(buildStarterPlan(activePlanProject).codexPrompt) }}</pre>
          </section>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.fab-fetch {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #111827;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 100;
}
.fab-fetch:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}
.fetch-dialog-shell {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fetch-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
}
.fetch-dialog {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 360px;
  max-width: 90vw;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}
.fetch-dialog h3 {
  margin: 0 0 8px;
  font-size: 18px;
}
.fetch-dialog p {
  margin: 0 0 16px;
  color: #657287;
  font-size: 14px;
}
.fetch-dialog input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dbe3ee;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 12px;
  box-sizing: border-box;
}
.fetch-dialog input:focus {
  outline: none;
  border-color: #225cff;
}
.fetch-status {
  font-size: 13px;
  margin-bottom: 12px;
  color: #18A058;
}
.fetch-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 12px;
}
.fetch-mode-select {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.fetch-mode-select label {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  border: 1px solid #dbe3ee;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.fetch-mode-select label.active {
  border-color: #225cff;
  background: #eef4ff;
  color: #225cff;
}
.fetch-mode-select input[type="radio"] {
  display: none;
}
.fetch-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.fetch-cancel, .fetch-confirm {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: none;
}
.fetch-cancel {
  background: #f1f5f9;
  color: #475569;
}
.fetch-confirm {
  background: #111827;
  color: white;
}
.fetch-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.fetched-skills-section {
  background: #f8fafc;
  padding: 48px 0;
}
.fetched-skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 24px;
}
.fetched-skill-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}
.fetched-skill-card:hover {
  border-color: #225cff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.fetched-skill-card .skill-card-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}
.fetched-skill-card .skill-rank {
  font-weight: 700;
  color: #225cff;
}
.fetched-skill-card .skill-stars {
  font-size: 13px;
  color: #64748b;
}
.fetched-skill-card h3 {
  font-size: 16px;
  margin: 0 0 8px;
}
.fetched-skill-card p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}
</style>
