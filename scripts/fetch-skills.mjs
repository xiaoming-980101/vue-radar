#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = resolve(__dirname, '../src/data/skills.json')
const SKILLS_HTML_PATH = resolve(__dirname, '../public/skills.html')
const TAGLINE_ZH_PATH = resolve(__dirname, '../src/data/tagline-zh.json')

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

function parseSkillsHtml(html) {
  const skills = []
  const skillRegex = /<article class="skill-card">([\s\S]*?)<\/article>/g
  const starSkillRegex = /<article class="star-skill-card[^"]*">([\s\S]*?)<\/article>/g
  let m

  // 解析普通 skill 卡片
  while ((m = skillRegex.exec(html)) !== null) {
    const content = m[1]
    const rankMatch = content.match(/<span>(\d+)<\/span>/)
    const nameMatch = content.match(/<h3>([^<]+)<\/h3>/)
    const descMatch = content.match(/<p>([^<]+)<\/p>/)
    const urlMatch = content.match(/href="([^"]+)"/)

    if (nameMatch) {
      skills.push({
        rank: rankMatch ? parseInt(rankMatch[1]) : 0,
        name: nameMatch[1].trim(),
        tagline: descMatch ? descMatch[1].trim() : '',
        url: urlMatch ? urlMatch[1] : '',
        totalStars: 0,
        category: 'skill'
      })
    }
  }

  // 解析 star skill 卡片
  while ((m = starSkillRegex.exec(html)) !== null) {
    const content = m[1]
    const rankMatch = content.match(/#(\d+)/)
    const nameMatch = content.match(/<h3>([^<]+)<\/h3>/)
    const descMatch = content.match(/<p>([^<]+)<\/p>/)
    const urlMatch = content.match(/href="([^"]+)"/)
    const starsMatch = content.match(/([\d.]+)k?\s*stars/)

    if (nameMatch) {
      skills.push({
        rank: rankMatch ? parseInt(rankMatch[1]) : 0,
        name: nameMatch[1].trim(),
        tagline: descMatch ? descMatch[1].trim() : '',
        url: urlMatch ? urlMatch[1] : '',
        totalStars: starsMatch ? parseFloat(starsMatch[1]) * (starsMatch[0].includes('k') ? 1000 : 1) : 0,
        category: 'star-skill'
      })
    }
  }

  return skills
}

function extractGitHubRepo(url) {
  const match = url.match(/github\.com\/([^/]+\/[^/]+)/)
  return match ? match[1] : null
}

async function fetchGitHubStars(repo) {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: githubHeaders()
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      totalStars: data.stargazers_count,
      description: data.description,
      language: data.language
    }
  } catch (e) {
    return null
  }
}

async function main() {
  console.log('开始解析 skills.html...')
  const html = readFileSync(SKILLS_HTML_PATH, 'utf8')
  const skills = parseSkillsHtml(html)
  console.log(`找到 ${skills.length} 个 skill`)

  console.log('\n开始从 GitHub 获取最新数据...')
  const seenRepos = new Set()

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i]
    const repo = extractGitHubRepo(skill.url)

    if (repo && !seenRepos.has(repo)) {
      seenRepos.add(repo)
      console.log(`获取: ${repo}`)
      const githubData = await fetchGitHubStars(repo)

      if (githubData) {
        skill.totalStars = githubData.totalStars
        if (!skill.tagline && githubData.description) {
          skill.tagline = taglineZh[repo] || githubData.description
        }
      }

      await new Promise(r => setTimeout(r, 1000))
    } else if (!repo) {
      console.log(`跳过: ${skill.name} (非 GitHub 链接)`)
    }
  }

  // 按 rank 排序
  skills.sort((a, b) => a.rank - b.rank)

  const output = {
    updatedAt: new Date().toISOString(),
    skills: skills.map((skill, i) => ({
      id: `skill-${i + 1}`,
      ...skill,
      tagline: taglineZh[skill.name] || skill.tagline
    }))
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`\n完成! 共 ${skills.length} 个 skill`)
  console.log(`保存到: ${OUTPUT_PATH}`)
  console.log(`更新时间: ${output.updatedAt}`)
}

main()
