#!/usr/bin/env node
import { writeFileSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = resolve(__dirname, '../src/data/github-trending.json')
const TAGLINE_ZH_PATH = resolve(__dirname, '../src/data/tagline-zh.json')

const TOPICS = [
  'ai-agents', 'self-hosted', 'esp32', 'webgl', 'home-assistant',
  'raspberry-pi', 'creative-coding', 'rag'
]

const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''

function githubHeaders() {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`
  }
  return headers
}

let taglineZh = {}
try {
  taglineZh = JSON.parse(readFileSync(TAGLINE_ZH_PATH, 'utf8'))
} catch (e) {
  console.warn('未找到中文翻译文件')
}

let previousProjects = new Map()
try {
  const previousData = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'))
  previousProjects = new Map((previousData.projects || []).map(project => [project.repo, project]))
} catch (e) {
  console.warn('未找到历史 GitHub 数据，将从 0 开始计算增长')
}

function hashString(value) {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function stableScore(repo, metric, min, range) {
  return min + (hashString(`${repo}:${metric}`) % range)
}

async function githubError(res) {
  const detail = await res.text().catch(() => '')
  const error = new Error(`GitHub API: ${res.status}${detail ? ` ${detail.slice(0, 160)}` : ''}`)
  error.status = res.status
  error.retryAfter = res.headers.get('retry-after')
  error.rateLimited = res.status === 403 || res.status === 429
  return error
}

async function fetchFromGitHub(topic) {
  const url = `https://api.github.com/search/repositories?q=topic:${topic}&sort=stars&order=desc&per_page=10`
  const res = await fetch(url, {
    headers: githubHeaders()
  })
  if (!res.ok) {
    throw await githubError(res)
  }
  const data = await res.json()
  return (data.items || []).map(item => ({
    repo: item.full_name,
    name: item.full_name,
    tagline: taglineZh[item.full_name] || item.description || '',
    language: item.language || 'Unknown',
    totalStars: item.stargazers_count,
    weeklyStars: Math.max(0, item.stargazers_count - (previousProjects.get(item.full_name)?.totalStars || item.stargazers_count)),
    url: item.html_url,
    topic: topic,
  }))
}

async function main() {
  console.log('开始爬取 GitHub 数据...')
  const allProjects = []
  const seenRepos = new Set()

  for (const topic of TOPICS) {
    try {
      console.log(`爬取: ${topic}`)
      const projects = await fetchFromGitHub(topic)
      for (const p of projects) {
        if (!seenRepos.has(p.repo)) {
          seenRepos.add(p.repo)
          allProjects.push(p)
        }
      }
      console.log(`  获取 ${projects.length} 个项目`)
      await new Promise(r => setTimeout(r, 2000))
    } catch (e) {
      console.error(`  失败: ${e.message}`)
      if (e.rateLimited) {
        throw new Error('GitHub API 速率限制，已停止写入，避免生成残缺榜单。请设置 GITHUB_TOKEN 或稍后重试。')
      }
    }
  }

  if (allProjects.length < 40) {
    throw new Error(`抓取结果只有 ${allProjects.length} 个项目，低于安全阈值，已停止写入。`)
  }

  allProjects.sort((a, b) => (b.weeklyStars - a.weeklyStars) || b.totalStars - a.totalStars)

  const output = {
    updatedAt: new Date().toISOString(),
    projects: allProjects.slice(0, 50).map((p, i) => ({
      id: `stars-${i + 1}`,
      track: 'stars',
      rank: i + 1,
      source: 'GitHub',
      ...p,
      trendingRank: i + 1,
      mvp: `探索 ${p.name.split('/')[1]} 项目，了解其核心功能和使用场景。`,
      wow: stableScore(p.repo, 'wow', 70, 25),
      useful: stableScore(p.repo, 'useful', 70, 25),
      easy: stableScore(p.repo, 'easy', 50, 40),
      stack: [p.language, p.weeklyStars ? `本次 +${p.weeklyStars}` : `${p.totalStars} stars`, `Topic: ${p.topic}`],
    }))
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`\n完成! 共 ${output.projects.length} 个项目`)
  console.log(`保存到: ${OUTPUT_PATH}`)
  console.log(`更新时间: ${output.updatedAt}`)
}

main()
