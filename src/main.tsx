import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App.tsx'
import { GalleryPage } from './pages/GalleryPage.tsx'
import { ViewerApp } from './pages/ViewerApp.tsx'
import { AdminPage } from './pages/AdminPage.tsx'
import './index.css'

const path = window.location.pathname;

let root: React.ReactNode;

if (path.includes('/gallery')) {
  root = <GalleryPage />;
} else if (path.includes('/admin')) {
  root = <AdminPage />;
} else {
  const viewMatch = path.match(/\/view\/([^/]+)/);
  if (viewMatch) {
    root = <ViewerApp mapId={viewMatch[1]} />;
  } else {
    root = <App />;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {root}
    <Analytics />
  </React.StrictMode>
)
