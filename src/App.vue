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
import { fetchAllBrowser, loadTrendingFromStorage } from './utils/browser-crawler.js'

const starProjects = ref(defaultStarProjects)
const starUpdatedAt = ref(defaultUpdatedAt)
const fetchedSkills = ref([])

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
  }
  return useCases[skill.id] ?? skill.description
}

function projectExperienceTags(project, limit = 4) {
  const text = projectText(project)
  const overrideTags = projectTagOverrides[project.name] ?? []
  const tags = [...overrideTags]
  if (!overrideTags.length) {
    projectTagRules.forEach(rule => { if (rule.match.test(text)) tags.push(...rule.tags) })
  }
  if (project.weeklyStars) tags.push(`本周 +${formatCount(project.weeklyStars)}`)
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
  if (project.track === 'stars') return `适合想"${goalText}"的新手：本周增长 +${formatCount(project.weeklyStars)} stars，先复刻一个最小使用场景就能摸到前沿脉搏。`
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
  const sourceType = sourceUrl.includes('github.com') ? 'GitHub 项目' : '参考项目/官方文档'
  const skills = recommendedSkills(project)
  const skillPromptLines = skills.map((skill, i) => `${i + 1}. ${skill.name}：${skill.url}\n   用法：${skillUseReason(project, skill)}`).join('\n')
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
    '你是 Codex，请和我一起把这个项目做成可运行 demo。',
    `我想做「${project.name}」的 MVP。`,
    `项目方向：${track.title}`,
    `参考来源：${sourceName}`,
    `推荐项目链接 / GitHub 链接：${sourceUrl}`,
    `推荐 Skill / 工具链接：\n${skillPromptLines}`,
    `目标演示：${project.mvp}`,
    `请帮我先做一个最小可运行版本，控制范围在 ${estimate} 内。`,
    `请先阅读这个${sourceType}的 README、安装说明、示例、demo 或官方文档，判断能否直接 clone、fork、复现、改造或借鉴核心玩法。`,
    '如果我的环境支持上面的 Skill 或 CLI，请优先安装/启用它们；如果暂时不支持，就把这些链接作为参考资料读完，再模拟同样的工作流来执行。',
    '优先让原项目或它的最小示例跑起来；如果原项目太复杂、依赖太重或不适合直接运行，再抽取最有趣/最实用的核心体验，做一个轻量可运行版本。',
    '请你根据项目特点自主选择最合适的实现方案；除非必要，不要让我先决定框架或库。',
    '请先给出文件结构和实现步骤，然后直接创建代码；优先做可运行 demo，不要做营销页。',
  ].join('\n')
  return { estimate, firstStep, steps, files, sourceName, sourceUrl, skills, codexPrompt }
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
    `项目来源：${plan.sourceName}`, `项目链接：${plan.sourceUrl}`, `预计用时：${plan.estimate}`, '',
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
            <p>本周增长最快的 GitHub 项目，来自 GitHub Trending weekly 候选池，并按 "stars this week" 重新排序。</p>
          </div>
          <div class="star-actions">
            <button class="star-tab-button" type="button" @click="setTrack('stars')">增长最快的 GitHub 项目</button>
            <a href="https://github.com/trending?since=weekly" target="_blank" rel="noreferrer">查看 GitHub 源</a>
          </div>
        </div>
        <div class="star-showcase-grid" aria-label="明星项目展示">
          <template v-if="starProjects.length > 0">
            <a class="star-card star-card-lead" :href="starProjects[0].url" target="_blank" rel="noreferrer">
              <div class="star-card-top"><span>#1</span><em>{{ formatCount(starProjects[0].totalStars || 0) }} stars</em></div>
              <strong>{{ starProjects[0].name }}</strong>
              <p>{{ starProjects[0].tagline }}</p>
              <div class="star-card-meta">
                <span v-for="tag in projectExperienceTags(starProjects[0], 3)" :key="tag">{{ tag }}</span>
              </div>
            </a>
            <div class="star-mini-grid">
              <a v-for="p in starProjects.slice(1, 6)" :key="p.id" class="star-card" :href="p.url" target="_blank" rel="noreferrer">
              <div class="star-card-top"><span>#{{ p.rank }}</span><em>{{ formatCount(p.weeklyStars || p.totalStars || 0) }} stars</em></div>
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
              <a class="source-link action-tile" :href="project.url" target="_blank" rel="noreferrer">
                <span>看来源</span><em>{{ project.source }}</em>
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
                      <a class="source-link action-tile" :href="project.url" target="_blank" rel="noreferrer">
                        <span>看来源</span><em>{{ project.source }}</em>
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
                <span>{{ project.track === 'stars' ? 'Weekly' : 'Skills' }}</span>
                <strong>{{ project.track === 'stars' ? formatCount(project.totalStars || 0) + ' stars' : recommendedSkills(project).length + ' 个' }}</strong>
              </div>
              <div class="card-actions">
                <button type="button" class="plan-button action-tile" @click="openPlan(project.id)">
                  <span>带 Skill 开工</span><em>Prompt + links</em>
                </button>
                <a class="source-link action-tile" :href="project.url" target="_blank" rel="noreferrer">
                  <span>看来源</span><em>{{ project.source }}</em>
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
        <div class="fetch-hint">没有 Token 每小时只能请求 10 次，有 Token 可请求 30 次</div>
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
        <p class="section-kicker">Fetched Skills</p>
        <h2>爬取的 Skill 数据</h2>
        <p>从 GitHub API 获取的最新 Skill 项目，按 stars 排序。</p>
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
          <button type="button" class="plan-close" @click="closePlan" aria-label="关闭开工计划">×</button>
        </header>
        <div class="plan-overview">
          <div class="plan-meta">
            <span>{{ trackById(activePlanProject.track).title }}</span>
            <span>预计 {{ buildStarterPlan(activePlanProject).estimate }}</span>
            <span>复制 Prompt 已带项目链接</span>
            <span v-for="tag in projectExperienceTags(activePlanProject, 2)" :key="tag">{{ tag }}</span>
          </div>
          <a class="plan-source-card" :href="escapeHtml(buildStarterPlan(activePlanProject).sourceUrl)" target="_blank" rel="noreferrer">
            <span>推荐项目入口</span>
            <strong>{{ escapeHtml(buildStarterPlan(activePlanProject).sourceName) }}</strong>
            <em>{{ escapeHtml(buildStarterPlan(activePlanProject).sourceUrl) }}</em>
          </a>
        </div>
        <div class="plan-grid">
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
