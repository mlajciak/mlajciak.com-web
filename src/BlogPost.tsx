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
import './BlogPost.css'

interface BlogMetadata {
  [key: string]: {
    title: string
    date: string
    tags: string[]
    description: string
    entry_point: string
    cover_image?: string
  }
}

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const [content, setContent] = useState<string>('')
  const [metadata, setMetadata] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme')
    return (savedTheme as 'light' | 'dark') || 'light'
  })
  const [fontSize, setFontSize] = useState<number>(() => {
    return Number(localStorage.getItem('blogFontSize')) || 14
  })

  const decreaseFont = () => setFontSize(s => { const n = Math.max(11, s - 1); localStorage.setItem('blogFontSize', String(n)); return n })
  const increaseFont = () => setFontSize(s => { const n = Math.min(20, s + 1); localStorage.setItem('blogFontSize', String(n)); return n })

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const loadBlogPost = async () => {
      try {
        const metadataResponse = await fetch('/blog/metadata.json')
        const allMetadata: BlogMetadata = await metadataResponse.json()
        
        const postEntry = Object.entries(allMetadata).find(([_, post]) => {
          const postSlug = post.entry_point.split('/')[0]
          return postSlug === slug
        })

        if (postEntry) {
          const [_, postMeta] = postEntry
          setMetadata(postMeta)
          const contentResponse = await fetch(`/blog/${postMeta.entry_point}`)
          const text = await contentResponse.text()
          setContent(text)
        }
      } catch (error) {
        console.error('Error loading blog post:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBlogPost()
  }, [slug])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const topNav = (
    <div className="blog-nav-wrapper">
      <nav className="blog-nav">
        <Link to="/" className="blog-nav-brand">
          <div className="blog-nav-photo">
            <img src="/photo.JPG" alt="Michal Lajčiak" />
          </div>
          <span className="blog-nav-name">Michal Lajčiak's blog</span>
        </Link>
        <div className="blog-nav-controls">
          <div className="font-size-controls">
            <Button variant="ghost" size="sm" className="font-btn font-btn--left" onClick={decreaseFont} aria-label="Decrease font size">
              <ALargeSmall size={12} strokeWidth={1.75} aria-hidden />
            </Button>
            <Button variant="ghost" size="sm" className="font-btn font-btn--right" onClick={increaseFont} aria-label="Increase font size">
              <ALargeSmall size={24} strokeWidth={1.75} aria-hidden />
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
      <div className="blog-post-page">
        {topNav}
        <div className="blog-post-container">
          <p className="loading">Loading...</p>
        </div>
      </div>
    )
  }

  if (!metadata) {
    return (
      <div className="blog-post-page">
        {topNav}
        <div className="blog-post-container">
          <p className="error">Blog post not found</p>
        </div>
      </div>
    )
  }

  const coverSrc =
    metadata.cover_image &&
    !metadata.cover_image.startsWith('http') &&
    !metadata.cover_image.startsWith('/')
      ? `/blog/${metadata.cover_image}`
      : metadata.cover_image

  return (
    <div className="blog-post-page">
      {topNav}
      <div className="blog-post-container">
        <article className="blog-article" style={{ fontSize: `${fontSize}pt` }}>
          <header className="article-header">
            <h1 className="article-title">{metadata.title}</h1>
            <p className="article-date">{formatDate(metadata.date)}</p>
            {coverSrc ? (
              <div className="article-cover">
                <img src={coverSrc} alt={metadata.title} />
              </div>
            ) : null}
          </header>

          <div className="article-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeSlug]}
              components={{
                img: ({ src, alt, title }) => {
                  const resolvedSrc = src && !src.startsWith('http') && !src.startsWith('/')
                    ? `/blog/${slug}/${src}`
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
                  return <img src={resolvedSrc} alt={cleanAlt} className={imgClass} style={{ maxWidth: '100%' }} />
                }
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
