import trendingData from './github-trending.json'

export function getGithubStarProjects() {
  const data = trendingData.projects || []

  return data.map((project, index) => ({
    id: `stars-${index + 1}`,
    track: 'stars',
    rank: index + 1,
    source: 'GitHub',
    repo: project.repo,
    name: project.name,
    tagline: project.tagline,
    language: project.language,
    totalStars: project.totalStars,
    weeklyStars: project.weeklyStars,
    topic: project.topic,
    trendingRank: project.trendingRank,
    mvp: project.mvp,
    wow: project.wow,
    useful: project.useful,
    easy: project.easy,
    url: project.url,
    stack: project.stack || [
      project.language,
      project.weeklyStars ? `本次 +${project.weeklyStars}` : `${project.totalStars || 0} stars`,
      `Topic: ${project.topic || 'trending'}`
    ],
  }))
}

export function getTrendingUpdatedAt() {
  return trendingData.updatedAt ? new Date(trendingData.updatedAt) : new Date()
}
