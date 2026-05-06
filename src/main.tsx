import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import { BlogPost } from './BlogPost.tsx'
import { ProjectPost } from './ProjectPost.tsx'
import { GemelFaceScanner } from './GemelFaceScanner.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/projects/gemel" element={<GemelFaceScanner />} />
        <Route path="/projects/:slug" element={<ProjectPost />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
