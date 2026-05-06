import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'

import { Button } from './ui'
import './App.css'

interface BlogPost {
  title: string
  date: string
  tags: string[]
  description: string
  entry_point: string
  cover_image?: string
}

interface BlogMetadata {
  [key: string]: BlogPost
}

function App() {
  const POSTS_PER_PAGE = 4
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme')
    return (savedTheme as 'light' | 'dark') || 'light'
  })

  useEffect(() => {
    fetch('/blog/metadata.json')
      .then(response => response.json())
      .then((data: BlogMetadata) => {
        const posts = Object.values(data)
        // Sort by date (newest first)
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setBlogPosts(posts)
      })
      .catch(error => console.error('Error loading blog posts:', error))
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const totalPages = Math.ceil(blogPosts.length / POSTS_PER_PAGE)
  const startIdx = (currentPage - 1) * POSTS_PER_PAGE
  const paginatedPosts = blogPosts.slice(startIdx, startIdx + POSTS_PER_PAGE)

  return (
    <div className="container">
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

      <header className="header">
        <div className="profile-section">
          <div className="profile-header">
            <div className="profile-image">
              <img src="/photo.JPG" alt="Profile" className="profile-img" />
            </div>
            
            <div className="profile-info">
              <h1 className="name">Michal Lajčiak</h1>
              <p className="bio">
                I like safe general-purpose neural nets.
              </p>
            </div>
          </div>
          
          <div className="social-links">
              <a href="https://x.com/lajciakmichal" target="_blank" rel="noopener noreferrer" className="social-badge" title="X (Twitter)">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>@lajciakmichal</span>
              </a>
              
              <a href="https://github.com/mlajciak" target="_blank" rel="noopener noreferrer" className="social-badge" title="GitHub">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>mlajciak</span>
              </a>
              
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="blog-section">
          <div className="blog-header">
            <h2 className="section-title">Blog</h2>
            {totalPages > 1 && (
              <div className="blog-pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`pagination-btn ${currentPage === page ? 'pagination-btn--active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                    aria-label={`Go to page ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="blog-posts">
            {paginatedPosts.length === 0 ? (
              <p className="no-posts">No blog posts yet.</p>
            ) : (
              paginatedPosts.map((post, index) => {
                const slug = post.entry_point.split('/')[0]
                return (
                  <Link to={`/blog/${slug}`} key={index} className="blog-post-link">
                    <article className="blog-post">
                      {post.cover_image && (
                        <div className="post-cover">
                          <img src={post.cover_image} alt={post.title} />
                        </div>
                      )}
                      <div className="post-content">
                        <h3 className="post-title">{post.title}</h3>
                        <p className="post-date">{formatDate(post.date)}</p>
                      </div>
                    </article>
                  </Link>
                )
              })
            )}
          </div>
        </div>

      </main>
    </div>
  )
}

export default App
