<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import '../assets/codex-uses-page.css'
import { codexCases, codexPanelItems, safetyNotes, weeklyCards } from '../data/codex-uses.js'

const copiedKey = ref('')
let copyTimer = null

function fallbackCopy(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

async function copyPrompt(item) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(item.prompt)
    } else {
      fallbackCopy(item.prompt)
    }
    copiedKey.value = item.rank
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedKey.value = ''
    }, 1400)
  } catch {
    fallbackCopy(item.prompt)
    copiedKey.value = item.rank
  }
}

onMounted(() => {
  document.title = 'Codex 趣味用法 · Vibe Coding 雷达'
})

onUnmounted(() => {
  if (copyTimer) clearTimeout(copyTimer)
})
</script>

<template>
  <a class="skip-link" href="#cases">跳到案例</a>
  <main class="codex-page">
    <header class="codex-topbar">
      <a class="codex-brand" href="/" aria-label="返回 Vibe Coding 雷达">
        <span class="codex-mark" aria-hidden="true"></span>
        <strong>Vibe Coding 雷达</strong>
      </a>
      <nav class="codex-site-switch" aria-label="页面切换">
        <a href="/">项目雷达</a>
        <a href="/skills.html">必装 Skill</a>
        <span>Codex 用法</span>
      </nav>
    </header>

    <section class="codex-hero" aria-labelledby="codexTitle">
      <div class="codex-hero-copy">
        <p class="codex-kicker">Codex Use Cases</p>
        <h1 id="codexTitle">Codex 趣味用法</h1>
        <p>
          不只写代码，也能诊断电脑、整理资料、做原型、跑测试、沉淀工作流。每个案例都先强调安全边界，再给你可复制提示词。
        </p>
        <div class="hero-actions">
          <a class="primary-link" href="#cases">看 12 个案例</a>
          <a class="secondary-link" href="#weekly">看下周更新</a>
        </div>
      </div>

      <aside class="codex-panel" aria-label="页面说明">
        <span>Use cases</span>
        <strong>{{ codexCases.length }}</strong>
        <p>复制提示词之前，先把要操作的页面、文件夹或目标告诉 Codex。</p>
        <ul class="panel-list">
          <li v-for="item in codexPanelItems" :key="item">{{ item }}</li>
        </ul>
        <a class="codex-panel-link" href="/skills.html">去看必装 Skill</a>
      </aside>
    </section>

    <section class="section-block case-board" id="cases">
      <div class="section-head">
        <p class="codex-kicker">Case Pool</p>
        <h2>Codex 趣味用法案例池</h2>
        <p>这些不是炫技菜单，而是适合直接拿去试的日常任务。</p>
      </div>

      <div class="case-grid">
        <article v-for="item in codexCases" :key="item.rank" class="use-card">
          <div class="use-card-top"><span>{{ item.rank }}</span><em>{{ item.tag }}</em></div>
          <h3>{{ item.title }}</h3>
          <div class="case-result">
            <span>能得到什么</span>
            <p>{{ item.result }}</p>
          </div>
          <div class="case-prompt">
            <div class="prompt-head">
              <span>Prompt</span>
              <button type="button" class="copy-prompt" @click="copyPrompt(item)">
                {{ copiedKey === item.rank ? '已复制' : '复制' }}
              </button>
            </div>
            <p class="prompt-text">{{ item.prompt }}</p>
          </div>
          <div class="source-row">
            <span class="source-tag">{{ item.sourceLabel }}</span>
            <a :href="item.sourceUrl" target="_blank" rel="noreferrer">来源链接</a>
          </div>
        </article>
      </div>
    </section>

    <section class="section-block weekly-section" id="weekly">
      <div class="section-head">
        <p class="codex-kicker">Next Update</p>
        <h2>下一批会更新什么</h2>
      </div>
      <div class="weekly-grid">
        <article v-for="(card, index) in weeklyCards" :key="card.title">
          <span>0{{ index + 1 }}</span>
          <h3>{{ card.title }}</h3>
          <p>{{ card.text }}</p>
        </article>
      </div>
    </section>

    <section class="section-block safety-section">
      <p class="codex-kicker">Source</p>
      <h2>收录说明</h2>
      <div class="weekly-grid">
        <article v-for="(note, index) in safetyNotes" :key="note.title">
          <span>0{{ index + 1 }}</span>
          <h3>{{ note.title }}</h3>
          <p>{{ note.text }}</p>
        </article>
      </div>
    </section>

    <footer class="site-footer" aria-label="网站备案信息">
      <span>Vibe Coding 雷达</span>
      <a href="/">项目雷达</a>
      <a href="/skills.html">必装 Skill</a>
    </footer>
  </main>
</template>
