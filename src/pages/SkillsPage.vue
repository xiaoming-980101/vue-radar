<script setup>
import { onMounted } from 'vue'
import '../assets/skills-page.css'
import {
  mustHaveSkills,
  radarSkill,
  risingSkills,
  skillCategories,
  skillDirectories,
  skillPageUpdatedAt,
  skillSections,
} from '../data/skill-page.js'

onMounted(() => {
  document.title = '必装 Skill · Vibe Coding 雷达'
})
</script>

<template>
  <a class="skip-link" href="#skillsTitle">跳到内容</a>
  <main class="skills-page">
    <header class="skills-topbar">
      <a class="skills-brand" href="/" aria-label="返回 Vibe Coding 雷达">
        <span class="skills-mark" aria-hidden="true"></span>
        <strong>Vibe Coding 雷达</strong>
      </a>
      <nav class="skills-site-switch" aria-label="页面切换">
        <a href="/">项目雷达</a>
        <span>必装 Skill</span>
        <a href="/codex-uses.html">Codex 用法</a>
      </nav>
    </header>

    <section class="skills-hero" aria-labelledby="skillsTitle">
      <div class="skills-hero-copy">
        <p class="skills-kicker">Must-have Skill · Beginner-first</p>
        <h1 id="skillsTitle">必装 Skill</h1>
        <p>
          给 AI Coding 新手看的 Skill 入口：先装通用底座，再按项目领域选择设计、文档、CLI、上线、数据库、模型和监控类能力包。
        </p>
        <div class="skills-update-schedule" aria-label="更新时间">
          <span>Updated</span>
          <strong>{{ skillPageUpdatedAt }}</strong>
          <em>手工策划 + GitHub 新星</em>
        </div>
        <nav class="category-jump" aria-label="Skill 分类">
          <a v-for="category in skillCategories" :key="category.id" :href="`#${category.id}`">
            {{ category.label }}
          </a>
          <a class="codex-jump-link" href="/codex-uses.html">Codex 用法案例</a>
        </nav>
      </div>

      <aside class="skills-scoreboard radar-skill-card" id="vibe-coding-radar-skill" aria-label="Vibe Coding Radar Skill">
        <span>{{ radarSkill.label }}</span>
        <strong>{{ radarSkill.name }}</strong>
        <p>{{ radarSkill.description }}</p>
        <div class="radar-skill-actions" aria-label="Skill 能力">
          <em v-for="action in radarSkill.actions" :key="action">{{ action }}</em>
        </div>
        <a class="scoreboard-link" :href="radarSkill.url" target="_blank" rel="noreferrer">GitHub Skill</a>
      </aside>
    </section>

    <section class="skills-section must-have-section" id="must-have">
      <div class="section-head">
        <p class="skills-kicker">00 · Must Install</p>
        <h2>必装 Skill</h2>
        <p>先装能显著降低返工、补足工具手脚、提升安全边界的通用能力。</p>
      </div>
      <div class="skill-grid">
        <article v-for="skill in mustHaveSkills" :key="skill.name" class="skill-card">
          <div class="card-meta"><span>{{ skill.rank }}</span><em>{{ skill.signal }}</em></div>
          <h3>{{ skill.name }}</h3>
          <p>{{ skill.description }}</p>
          <a :href="skill.url" target="_blank" rel="noreferrer">打开来源</a>
        </article>
      </div>
    </section>

    <section class="skills-section star-skill-section" id="star-skills">
      <div class="section-head">
        <p class="skills-kicker">01 · Rising Skills</p>
        <h2>本周新星 Skill 项目</h2>
        <p>用来观察正在冒头的 Skill / Agent 工具方向，优先收录有明确用途的项目。</p>
      </div>
      <div class="star-skill-board" aria-label="本周新星 Skill 项目">
        <article
          v-for="(skill, index) in risingSkills"
          :key="skill.name"
          class="star-skill-card"
          :class="{ 'star-skill-card-lead': index === 0 }"
        >
          <div class="star-skill-top">
            <span class="star-rank">#{{ skill.rank }}</span>
            <span class="star-date">{{ skill.growth }}</span>
          </div>
          <h3>{{ skill.name }}</h3>
          <p>{{ skill.description }}</p>
          <div class="star-skill-meta">
            <a :href="skill.url" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </article>
      </div>
    </section>

    <section class="safety-note" id="standard" aria-label="排行标准">
      <p class="skills-kicker">How to Read</p>
      <h2>这是“先用起来”的榜</h2>
      <p>
        排序不只看 star，也看新手能不能理解、能不能在真实工作里马上试、能不能帮 AI 降低误操作和返工。
      </p>
    </section>

    <section v-for="section in skillSections" :key="section.id" class="skills-section" :id="section.id">
      <div class="section-head">
        <p class="skills-kicker">{{ section.eyebrow }}</p>
        <h2>{{ section.title }}</h2>
        <p>{{ section.description }}</p>
      </div>
      <div class="skill-grid">
        <article v-for="skill in section.cards" :key="`${section.id}-${skill.name}`" class="skill-card">
          <div class="card-meta"><span>{{ skill.rank }}</span><em>{{ skill.signal }}</em></div>
          <h3>{{ skill.name }}</h3>
          <p>{{ skill.description }}</p>
          <a :href="skill.url" target="_blank" rel="noreferrer">打开来源</a>
        </article>
      </div>
    </section>

    <section class="skills-section directory-section" id="directories">
      <div class="section-head">
        <p class="skills-kicker">08 · Directories</p>
        <h2>再去这些目录继续找</h2>
        <p>当你已经知道自己的项目方向，可以从这些目录继续扩展工具能力。</p>
      </div>
      <div class="directory-strip">
        <a v-for="directory in skillDirectories" :key="directory.name" :href="directory.url" target="_blank" rel="noreferrer">
          <strong>{{ directory.name }}</strong>
          <span>{{ directory.description }}</span>
        </a>
      </div>
    </section>

    <footer class="site-footer" aria-label="网站备案信息">
      <span>Vibe Coding 雷达</span>
      <a href="/">项目雷达</a>
      <a href="/codex-uses.html">Codex 用法案例</a>
    </footer>
  </main>
</template>
