import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import LoginForm from '../components/Auth/LoginForm'
import RegisterForm from '../components/Auth/RegisterForm'
import { useAuth } from '../hooks/useAuth'

export default function Auth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isRegister = location.pathname === '/register'

  const inviteCode = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('invite') || ''
  }, [location.search])

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">EdgeOne-Pages-ImgBed</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isRegister ? '创建你的账号' : '登录你的账号'}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          {isRegister ? <RegisterForm initialInviteCode={inviteCode} /> : <LoginForm />}
        </div>
      </div>
    </div>
  )
}
