import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import App from './App'
import BlogPost from './BlogPost'
import Recommendations from './Recommendations'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/recommendations" element={<Recommendations />} />
      </Routes>
    </Router>
  </React.StrictMode>,
)
