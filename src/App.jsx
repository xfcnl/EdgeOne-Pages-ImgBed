import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { seedAdmin } from './lib/seedAdmin'
import MainLayout from './components/Layout/MainLayout'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Recent from './pages/Recent'
import AlbumView from './pages/AlbumView'
import Settings from './pages/Settings'

function Banned() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="text-center">
        <svg className="w-20 h-20 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">账号已被封禁</h1>
        <p className="text-gray-500 dark:text-gray-400">请联系管理员解封</p>
      </div>
    </div>
  )
}

export default function App() {
  useEffect(() => { seedAdmin() }, [])

  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth />} />
      <Route path="/banned" element={<Banned />} />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="recent" element={<Recent />} />
        <Route path="albums/:id" element={<AlbumView />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
