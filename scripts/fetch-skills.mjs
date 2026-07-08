#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  mustHaveSkills,
  radarSkill,
  risingSkills,
  skillSections,
} from '../src/data/skill-page.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = resolve(__dirname, '../src/data/skills.json')

const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''

function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`
  }
  return headers
}

let previousSkills = new Map()
try {
  const previousData = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'))
  previousSkills = new Map()
  ;(previousData.skills || []).forEach((skill) => {
    if (skill.url) previousSkills.set(`url:${skill.url.toLowerCase()}`, skill)
    if (skill.name) previousSkills.set(`name:${skill.name.toLowerCase()}`, skill)
  })
} catch {
  console.warn('未找到历史 Skill 数据，将从 0 开始计算 stars')
}

function previousSkill(name, url) {
  return previousSkills.get(`url:${String(url).toLowerCase()}`)
    || previousSkills.get(`name:${String(name).toLowerCase()}`)
    || null
}

function skillItem({ rank, signal, name, description, url, category, growth }) {
  const previous = previousSkill(name, url)
  return {
    rank: Number.parseInt(String(rank).replace(/\D/g, ''), 10) || 0,
    name,
    tagline: description,
    url,
    totalStars: previous?.totalStars ?? 0,
    category,
    ...(previous?.language ? { language: previous.language } : {}),
    ...(signal ? { signal } : {}),
    ...(growth ? { growth } : {}),
  }
}

function collectSkills() {
  const skills = [
    skillItem({
      rank: 0,
      signal: radarSkill.label,
      name: radarSkill.name,
      description: radarSkill.description,
      url: radarSkill.url,
      category: 'radar-skill',
    }),
    ...mustHaveSkills.map((skill) => skillItem({ ...skill, category: 'must-have' })),
    ...risingSkills.map((skill) => skillItem({ ...skill, category: 'star-skill' })),
  ]

  skillSections.forEach((section) => {
    section.cards.forEach((skill) => {
      skills.push(skillItem({ ...skill, category: section.id }))
    })
  })

  return skills
}

function extractGitHubRepo(url) {
  const match = String(url).match(/github\.com\/([^/]+\/[^/#?]+)/i)
  return match ? match[1].replace(/\.git$/i, '') : null
}

async function fetchGitHubData(repo) {
  const res = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: githubHeaders(),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.warn(`  跳过 ${repo}: GitHub API ${res.status}${detail ? ` ${detail.slice(0, 120)}` : ''}`)
    return null
  }
  const data = await res.json()
  return {
    totalStars: data.stargazers_count ?? 0,
    description: data.description ?? '',
    language: data.language ?? '',
  }
}

async function main() {
  console.log('开始从 skill-page.js 生成 Skill 数据...')
  const skills = collectSkills()
  console.log(`找到 ${skills.length} 个 skill 条目`)

  console.log('\n开始从 GitHub 获取最新数据...')
  const repoDataCache = new Map()

  for (const skill of skills) {
    const repo = extractGitHubRepo(skill.url)
    if (!repo) {
      console.log(`跳过: ${skill.name} (非 GitHub 链接)`)
      continue
    }

    const cacheKey = repo.toLowerCase()
    if (!repoDataCache.has(cacheKey)) {
      console.log(`获取: ${repo}`)
      repoDataCache.set(cacheKey, await fetchGitHubData(repo))
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 1000))
    }

    const githubData = repoDataCache.get(cacheKey)
    if (githubData) {
      skill.totalStars = githubData.totalStars
      if (!skill.tagline && githubData.description) {
        skill.tagline = githubData.description
      }
      if (githubData.language) {
        skill.language = githubData.language
      }
    }
  }

  skills.sort((a, b) => {
    if (a.category === b.category) return a.rank - b.rank || a.name.localeCompare(b.name)
    return a.category.localeCompare(b.category)
  })

  const output = {
    updatedAt: new Date().toISOString(),
    skills: skills.map((skill, i) => ({
      id: `skill-${i + 1}`,
      ...skill,
    })),
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`\n完成! 共 ${skills.length} 个 skill`)
  console.log(`保存到: ${OUTPUT_PATH}`)
  console.log(`更新时间: ${output.updatedAt}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
