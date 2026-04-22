import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import 'katex/dist/katex.min.css'
import { ALargeSmall, Moon, Sun } from 'lucide-react'
import { Button } from './ui'
import { resolveProjectCoverSrc, publicAsset } from './projectCover'
import './BlogPost.css'
import './ProjectPost.css'

interface ProjectEntry {
  name: string
  description: string
  url?: string
  entry_point?: string
  cover_image?: string
}

interface ProjectMetadata {
  [key: string]: ProjectEntry
}

export function ProjectPost() {
  const { slug } = useParams<{ slug: string }>()
  const [content, setContent] = useState<string>('')
  const [metadata, setMetadata] = useState<ProjectEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme')
    return (savedTheme as 'light' | 'dark') || 'light'
  })
  const [fontSize, setFontSize] = useState<number>(() => {
    return Number(localStorage.getItem('blogFontSize')) || 14
  })

  const decreaseFont = () =>
    setFontSize((s) => {
      const n = Math.max(11, s - 1)
      localStorage.setItem('blogFontSize', String(n))
      return n
    })
  const increaseFont = () =>
    setFontSize((s) => {
      const n = Math.min(20, s + 1)
      localStorage.setItem('blogFontSize', String(n))
      return n
    })

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const loadProject = async () => {
      try {
        const metadataResponse = await fetch(publicAsset('projects/project.json'))
        const allMetadata: ProjectMetadata = await metadataResponse.json()

        const projectEntry = Object.values(allMetadata).find((project) => {
          if (!project.entry_point) return false
          const projectSlug = project.entry_point.split('/')[0]
          return projectSlug === slug
        })

        if (projectEntry?.entry_point) {
          setMetadata(projectEntry)
          const contentResponse = await fetch(publicAsset(`projects/${projectEntry.entry_point}`))
          const text = await contentResponse.text()
          setContent(text)
        }
      } catch (error) {
        console.error('Error loading project:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [slug])

  const topNav = (
    <div className="blog-nav-wrapper">
      <nav className="blog-nav">
        <Link to="/" className="blog-nav-brand">
          <div className="blog-nav-photo">
            <img src="/photo.JPG" alt="Michal Lajčiak" />
          </div>
          <span className="blog-nav-name">Michal Lajčiak's projects</span>
        </Link>
        <div className="blog-nav-controls">
          <div className="font-size-controls">
            <Button
              variant="ghost"
              size="sm"
              className="font-btn font-btn--left"
              onClick={decreaseFont}
              aria-label="Decrease font size"
            >
              <ALargeSmall size={17} strokeWidth={1.75} aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="font-btn font-btn--right"
              onClick={increaseFont}
              aria-label="Increase font size"
            >
              <ALargeSmall size={17} strokeWidth={1.75} aria-hidden />
            </Button>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          >
            {theme === 'light' ? <Moon size={18} strokeWidth={1.75} aria-hidden /> : <Sun size={18} strokeWidth={1.75} aria-hidden />}
          </Button>
        </div>
      </nav>
    </div>
  )

  if (loading) {
    return (
      <div className="blog-post-page project-post-page">
        {topNav}
        <div className="blog-post-container">
          <p className="loading">Loading...</p>
        </div>
      </div>
    )
  }

  if (!metadata) {
    return (
      <div className="blog-post-page project-post-page">
        {topNav}
        <div className="blog-post-container">
          <p className="error">Project not found</p>
        </div>
      </div>
    )
  }

  const coverSrc = resolveProjectCoverSrc(metadata)

  return (
    <div className="blog-post-page project-post-page">
      {topNav}
      <div className="blog-post-container">
        <article className="blog-article" style={{ fontSize: `${fontSize}pt` }}>
          <header className="article-header">
            <h1 className="article-title">{metadata.name}</h1>
            <p className="article-date project-article-lead">{metadata.description}</p>
            {coverSrc ? (
              <div className="article-cover">
                <img src={coverSrc} alt={metadata.name} />
              </div>
            ) : null}
          </header>

          <div className="article-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeSlug]}
              components={{
                img: ({ src, alt, title }) => {
                  const resolvedSrc =
                    src && !src.startsWith('http') && !src.startsWith('/')
                      ? `/projects/${slug}/${src}`
                      : src
                  const shouldInvert = alt?.endsWith('|invert') ?? false
                  const cleanAlt = shouldInvert ? alt!.slice(0, -7).trimEnd() : alt
                  const imgClass = shouldInvert ? 'invert-on-dark' : undefined
                  if (title) {
                    return (
                      <figure className="article-figure">
                        <img src={resolvedSrc} alt={cleanAlt} className={imgClass} />
                        <figcaption>{title}</figcaption>
                      </figure>
                    )
                  }
                  return (
                    <img
                      src={resolvedSrc}
                      alt={cleanAlt}
                      className={imgClass}
                      style={{ maxWidth: '100%' }}
                    />
                  )
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  )
}
