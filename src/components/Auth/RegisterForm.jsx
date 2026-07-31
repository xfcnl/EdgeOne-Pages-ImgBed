import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useSettings } from '../../hooks/useSettings'
import { useInviteCodes } from '../../hooks/useInviteCodes'

export default function RegisterForm({ initialInviteCode = '' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState(initialInviteCode)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const { settings, loading: settingsLoading } = useSettings()
  const { validateCode, markUsed } = useInviteCodes()

  useEffect(() => {
    if (initialInviteCode) setInviteCode(initialInviteCode)
  }, [initialInviteCode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (settings?.registration_mode === 'restricted') {
      if (!inviteCode.trim()) {
        setError('请输入邀请码')
        return
      }
      const result = await validateCode(inviteCode.trim())
      if (!result.valid) {
        setError('邀请码无效或已过期')
        return
      }
    }

    const { data, error: err } = await signUp(email, password, {
      emailRedirectTo: window.location.origin,
    })
    if (err) {
      setError(err.message)
      return
    }

    if (settings?.registration_mode === 'restricted' && data?.user) {
      const result = await validateCode(inviteCode.trim())
      if (result.valid && result.id) {
        await markUsed(result.id, data.user.id)
      }
    }

    setSuccess(true)
  }

  if (settingsLoading) {
    return <div className="text-center text-sm text-gray-400 py-4">加载中...</div>
  }

  if (settings?.registration_mode === 'private') {
    return (
      <div className="text-center py-4">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">当前暂未开放注册</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center">
        <p className="text-green-500 mb-2">注册成功！</p>
        <p className="text-sm text-gray-500">
          验证邮件已发送至 <span className="font-medium">{email}</span>，
          请点击邮件中的链接完成验证后再登录
        </p>
        <p className="text-sm text-gray-400 mt-1">未验证的邮箱无法登录，请勿关闭本页</p>
        <Link
          to="/login"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
        >
          验证完成后去登录
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          邮箱
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          密码
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {settings?.registration_mode === 'restricted' && (
        <div>
          <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            邀请码
          </label>
          <input
            id="inviteCode"
            type="text"
            required
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            placeholder="请输入邀请码"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 cursor-pointer"
      >
        注册
      </button>
      <p className="text-sm text-center text-gray-500 dark:text-gray-400">
        已有账号？
        <Link to="/login" className="text-blue-500 hover:text-blue-600 ml-1">登录</Link>
      </p>
    </form>
  )
}
