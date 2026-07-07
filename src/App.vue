<script setup>
import { computed, defineAsyncComponent } from 'vue'

const HomePage = defineAsyncComponent(() => import('./pages/HomePage.vue'))
const SkillsPage = defineAsyncComponent(() => import('./pages/SkillsPage.vue'))
const CodexUsesPage = defineAsyncComponent(() => import('./pages/CodexUsesPage.vue'))

const routes = {
  '/': HomePage,
  '/index.html': HomePage,
  '/skills.html': SkillsPage,
  '/codex-uses.html': CodexUsesPage,
}

const activePage = computed(() => {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  return routes[path] ?? HomePage
})
</script>

<template>
  <component :is="activePage" />
</template>
