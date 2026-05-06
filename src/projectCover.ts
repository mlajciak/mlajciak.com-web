function withViteBase(rootAbsolute: string): string {
  const raw = import.meta.env.BASE_URL ?? '/'
  const base = raw.replace(/\/+$/, '') || ''
  const path = rootAbsolute.startsWith('/') ? rootAbsolute : `/${rootAbsolute}`
  if (!base) return path
  return `${base}${path}`
}

/** Root-relative paths for files under `public/` (e.g. `projects/project.json` or `/projects/foo.png`). */
export function publicAsset(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return withViteBase(p)
}

export function resolveProjectCoverSrc(project: {
  cover_image?: string
  entry_point?: string
}): string | null {
  const c = project.cover_image?.trim()
  if (!c) return null
  if (/^https?:\/\//i.test(c)) return c
  let path: string
  if (c.startsWith('/')) {
    path = c
  } else {
    const slug = project.entry_point?.split('/')[0]
    if (slug && !c.includes('/')) path = `/projects/${slug}/${c}`
    else path = `/projects/${c}`
  }
  return withViteBase(path)
}
