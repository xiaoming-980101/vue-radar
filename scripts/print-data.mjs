import { readFileSync } from 'fs'

console.log('========== 静态分类项目（不变的原始内容） ==========')
console.log('')

const content = readFileSync('./src/data/index.js', 'utf8')

const funMatch = content.match(/"fun": \[([\s\S]*?)\],\s*"useful"/)
if (funMatch) {
  const names = [...funMatch[1].matchAll(/"name": "([^"]+)"/g)].map(m => m[1])
  console.log('【好玩】(fun) - ' + names.length + '个项目：')
  names.forEach((name, i) => console.log('  ' + (i+1) + '. ' + name))
  console.log('')
}

const usefulMatch = content.match(/"useful": \[([\s\S]*?)\],\s*"hardware"/)
if (usefulMatch) {
  const names = [...usefulMatch[1].matchAll(/"name": "([^"]+)"/g)].map(m => m[1])
  console.log('【好用】(useful) - ' + names.length + '个项目：')
  names.forEach((name, i) => console.log('  ' + (i+1) + '. ' + name))
  console.log('')
}

const hwMatch = content.match(/"hardware": \[([\s\S]*?)\]\s*\};/)
if (hwMatch) {
  const names = [...hwMatch[1].matchAll(/"name": "([^"]+)"/g)].map(m => m[1])
  console.log('【好搓】(hardware) - ' + names.length + '个项目：')
  names.forEach((name, i) => console.log('  ' + (i+1) + '. ' + name))
  console.log('')
}

console.log('========== 爬取的 GitHub 项目（动态更新内容） ==========')
const data = JSON.parse(readFileSync('./src/data/github-trending.json', 'utf8'))
console.log('更新时间:', data.updatedAt)
console.log('项目数量:', data.projects?.length)
console.log('')
data.projects?.forEach((p, i) => {
  console.log('  ' + (i+1) + '. ' + p.name + ' | stars: ' + p.totalStars + ' | topic: ' + p.topic)
})
