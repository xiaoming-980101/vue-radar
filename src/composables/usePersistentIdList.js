import { ref, watch } from 'vue'

function readStoredIds(storageKey) {
  if (typeof localStorage === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]')
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : []
  } catch {
    return []
  }
}

function uniqueIds(ids, max) {
  const next = []
  ids.forEach((id) => {
    const value = String(id)
    if (value && !next.includes(value)) next.push(value)
  })
  return Number.isFinite(max) ? next.slice(0, max) : next
}

export function usePersistentIdList(storageKey, options = {}) {
  const max = options.max ?? Infinity
  const ids = ref(uniqueIds(readStoredIds(storageKey), max))

  watch(ids, (next) => {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(storageKey, JSON.stringify(uniqueIds(next, max)))
  }, { deep: true })

  function replace(nextIds) {
    ids.value = uniqueIds(nextIds, max)
  }

  function has(id) {
    return ids.value.includes(String(id))
  }

  function add(id) {
    const value = String(id)
    if (!value || has(value) || ids.value.length >= max) return false
    ids.value = [...ids.value, value]
    return true
  }

  function remove(id) {
    const value = String(id)
    ids.value = ids.value.filter((item) => item !== value)
  }

  function toggle(id) {
    if (has(id)) {
      remove(id)
      return false
    }
    return add(id)
  }

  function clear() {
    ids.value = []
  }

  return { ids, replace, has, add, remove, toggle, clear }
}
