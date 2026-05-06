import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import { ALargeSmall, Moon, Sun } from 'lucide-react'
import 'katex/dist/katex.min.css'
import './BlogPost.css'

interface PostMeta {
  title: string
  date: string
  entry_point: string
  cover_image?: string
  pinned?: boolean
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const [content, setContent] = useState('')
  const [meta, setMeta] = useState<PostMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  )
  const [fontSize, setFontSize] = useState(
    () => Number(localStorage.getItem('blogFontSize')) || 14
  )

  useEffect(() => { document.body.setAttribute('data-theme', theme) }, [theme])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
  }

  const decFont = () => setFontSize(s => { const n = Math.max(11, s - 1); localStorage.setItem('blogFontSize', String(n)); return n })
  const incFont = () => setFontSize(s => { const n = Math.min(20, s + 1); localStorage.setItem('blogFontSize', String(n)); return n })

  useEffect(() => {
    fetch('/blog/metadata.json')
      .then(r => r.json())
      .then(async data => {
        const entry = Object.values(data as Record<string, PostMeta>).find(
          p => p.entry_point.split('/')[0] === slug
        )
        if (entry) {
          setMeta(entry)
          const text = await fetch(`/blog/${entry.entry_point}`).then(r => r.text())
          setContent(text)
        }
      })
      .finally(() => setLoading(false))
  }, [slug])

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const nav = (
    <div className="nav-wrap">
      <nav className="blog-nav">
        <Link to="/" className="nav-brand">
          <div className="nav-photo"><img src="/photo.JPG" alt="Michal Lajčiak" /></div>
          <span>Michal Lajčiak's posts</span>
        </Link>
        <div className="nav-controls">
          <div className="font-controls">
            <button onClick={decFont} aria-label="Decrease font"><ALargeSmall size={12} strokeWidth={1.75} /></button>
            <button onClick={incFont} aria-label="Increase font"><ALargeSmall size={24} strokeWidth={1.75} /></button>
          </div>
          <button className="theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={18} strokeWidth={1.75} /> : <Sun size={18} strokeWidth={1.75} />}
          </button>
        </div>
      </nav>
    </div>
  )

  if (loading) return <div className="post-page">{nav}<div className="post-container"><p className="status">Loading…</p></div></div>
  if (!meta) return <div className="post-page">{nav}<div className="post-container"><p className="status">Post not found.</p></div></div>

  return (
    <div className="post-page">
      {nav}
      <div className="post-container">
        <article style={{ fontSize: `${fontSize}pt` }}>
          <header className="post-header">
            <h1>{meta.title}</h1>
            <p className="post-date">{meta.pinned ? 'Pinned' : fmt(meta.date)}</p>
          </header>
          <div className="post-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeSlug]}
              components={{
                img: ({ src, alt, title }) => {
                  const resolved = src && !src.startsWith('http') && !src.startsWith('/')
                    ? `/blog/${slug}/${src}`
                    : src
                  const invert = alt?.endsWith('|invert') ?? false
                  const cleanAlt = invert ? alt!.slice(0, -7).trimEnd() : alt
                  if (title) {
                    return (
                      <figure>
                        <img src={resolved} alt={cleanAlt} className={invert ? 'invert-dark' : undefined} />
                        <figcaption>{title}</figcaption>
                      </figure>
                    )
                  }
                  return <img src={resolved} alt={cleanAlt} className={invert ? 'invert-dark' : undefined} style={{ maxWidth: '100%' }} />
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
