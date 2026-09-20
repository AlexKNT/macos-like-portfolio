import type { TechGroup } from '#content/types'

/** The stack areas the skills window prints, one group per area. */
export const TECH_GROUPS: readonly TechGroup[] = [
  { id: 'frontend', category: 'Frontend', items: ['React.js', 'Next.js', 'TypeScript'] },
  { id: 'mobile', category: 'Mobile', items: ['React Native', 'Expo'] },
  { id: 'styling', category: 'Styling', items: ['Tailwind CSS', 'Sass', 'CSS'] },
  { id: 'backend', category: 'Backend', items: ['Node.js', 'Express', 'NestJS', 'Hono'] },
  { id: 'database', category: 'Database', items: ['MongoDB', 'PostgreSQL'] },
  { id: 'tools', category: 'Dev Tools', items: ['Git', 'GitHub', 'Docker'] },
]
