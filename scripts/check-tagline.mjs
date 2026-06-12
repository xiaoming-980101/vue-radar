import { readFileSync } from 'fs'

const content = readFileSync('./src/data/index.js', 'utf8')

// 提取原始静态数据中的 star 项目
const starSection = content.match(/export const githubStarProjects = getGithubStarProjects\(\)/)
console.log('=== 原始静态数据 ===')
console.log('githubStarProjects 使用 getGithubStarProjects() 从 JSON 加载')
console.log('')

// 读取 JSON 数据
const data = JSON.parse(readFileSync('./src/data/github-trending.json', 'utf8'))
console.log('=== JSON 数据中的 star 项目 ===')
data.projects.forEach(p => {
  const hasChinese = /[\u4e00-\u9fa5]/.test(p.tagline)
  console.log(p.name + ': ' + (hasChinese ? '✅ 有中文' : '❌ 纯英文'))
  console.log('  tagline: ' + (p.tagline || '(空)'))
})
