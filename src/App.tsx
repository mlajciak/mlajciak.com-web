import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import './App.css'

interface BlogPost {
  title: string
  date: string
  entry_point: string
}

export default function App() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  )

  useEffect(() => {
    fetch('/blog/metadata.json')
      .then(r => r.json())
      .then(data => {
        const list: BlogPost[] = Object.values(data)
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setPosts(list)
      })
  }, [])

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="container">
      <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'light' ? <Moon size={18} strokeWidth={1.75} /> : <Sun size={18} strokeWidth={1.75} />}
      </button>

      <header className="header">
        <div className="profile">
          <div className="avatar">
            <img src="/photo.JPG" alt="Michal Lajčiak" />
          </div>
          <div className="info">
            <h1>Michal Lajčiak</h1>
            <p>I like safe general-purpose neural nets.</p>
          </div>
        </div>
        <div className="social">
          <a href="https://x.com/lajciakmichal" target="_blank" rel="noopener noreferrer" className="badge">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span>@lajciakmichal</span>
          </a>
          <a href="https://github.com/mlajciak" target="_blank" rel="noopener noreferrer" className="badge">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            <span>mlajciak</span>
          </a>
        </div>
      </header>

      <main className="main">
        <section className="blog-section">
          <h2>Blog</h2>
          <div className="post-list">
            {posts.length === 0 ? (
              <p className="empty">No posts yet.</p>
            ) : (
              posts.map((post, i) => (
                <Link key={i} to={`/blog/${post.entry_point.split('/')[0]}`} className="post-link">
                  <article className="post-item">
                    <h3>{post.title}</h3>
                    <p>{fmt(post.date)}</p>
                  </article>
                </Link>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
