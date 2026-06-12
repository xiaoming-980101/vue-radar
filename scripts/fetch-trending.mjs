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

let taglineZh = {}
try {
  taglineZh = JSON.parse(readFileSync(TAGLINE_ZH_PATH, 'utf8'))
} catch (e) {
  console.warn('未找到中文翻译文件')
}

async function fetchFromGitHub(topic) {
  const url = `https://api.github.com/search/repositories?q=topic:${topic}&sort=stars&order=desc&per_page=10`
  const res = await fetch(url, {
    headers: { 'Accept': 'application/vnd.github.v3+json' }
  })
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`)
  const data = await res.json()
  return (data.items || []).map(item => ({
    repo: item.full_name,
    name: item.full_name,
    tagline: taglineZh[item.full_name] || item.description || '',
    language: item.language || 'Unknown',
    totalStars: item.stargazers_count,
    weeklyStars: 0,
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
    }
  }

  allProjects.sort((a, b) => b.totalStars - a.totalStars)

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
      wow: Math.min(95, 70 + Math.floor(Math.random() * 25)),
      useful: Math.min(95, 70 + Math.floor(Math.random() * 25)),
      easy: Math.min(95, 50 + Math.floor(Math.random() * 40)),
      stack: [p.language, `+${p.totalStars} stars`, `Topic: ${p.topic}`],
    }))
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`\n完成! 共 ${output.projects.length} 个项目`)
  console.log(`保存到: ${OUTPUT_PATH}`)
  console.log(`更新时间: ${output.updatedAt}`)
}

main()
