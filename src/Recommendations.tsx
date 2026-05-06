import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Moon, Sun } from 'lucide-react'
import './BlogPost.css'

export default function Recommendations() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  )

  useEffect(() => { document.body.setAttribute('data-theme', theme) }, [theme])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
  }

  useEffect(() => {
    fetch('/recommendations.md')
      .then(r => r.text())
      .then(setContent)
      .finally(() => setLoading(false))
  }, [])

  const nav = (
    <div className="nav-wrap">
      <nav className="blog-nav">
        <Link to="/" className="nav-brand">
          <div className="nav-photo"><img src="/photo.JPG" alt="Michal Lajčiak" /></div>
          <span>Michal Lajčiak's blog</span>
        </Link>
        <div className="nav-controls">
          <button className="theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={18} strokeWidth={1.75} /> : <Sun size={18} strokeWidth={1.75} />}
          </button>
        </div>
      </nav>
    </div>
  )

  if (loading) return <div className="post-page">{nav}<div className="post-container"><p className="status">Loading…</p></div></div>

  return (
    <div className="post-page">
      {nav}
      <div className="post-container">
        <article>
          <header className="post-header">
            <h1>Recommendations for Reading</h1>
          </header>
          <div className="post-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  )
}
