import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSettings } from '../hooks/useSettings'
import { useInviteCodes } from '../hooks/useInviteCodes'

export default function Settings() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">管理面板</h1>

        <AccountSection user={user} signOut={signOut} />

        {isAdmin && (
          <>
            <AdminUserManagement />
            <RegistrationSettings />
            <InviteCodeManager />
          </>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h2>
      {children}
    </section>
  )
}

function AccountSection({ user, signOut }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [emailMsg, setEmailMsg] = useState('')
  const [emailError, setEmailError] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')

  const handleChangeEmail = async (e) => {
    e.preventDefault()
    setEmailMsg('')
    setEmailError('')
    const { error } = await supabase.auth.updateUser({ email })
    if (error) setEmailError(error.message)
    else { setEmailMsg('确认邮件已发送，请查收'); setEmail('') }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwMsg('')
    setPwError('')
    if (newPassword.length < 6) { setPwError('密码至少 6 位'); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setPwError(error.message)
    else { setPwMsg('密码已更新'); setNewPassword('') }
  }

  return (
    <Section title="账户设置">
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">当前邮箱</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</p>
        </div>

        <form onSubmit={handleChangeEmail} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">修改邮箱</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="新邮箱地址"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors cursor-pointer"
            >
              确认修改
            </button>
          </div>
          {emailMsg && <p className="text-sm text-green-500">{emailMsg}</p>}
          {emailError && <p className="text-sm text-red-500">{emailError}</p>}
        </form>

        <form onSubmit={handleChangePassword} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">修改密码</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="新密码（至少 6 位）"
              minLength={6}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors cursor-pointer"
            >
              确认修改
            </button>
          </div>
          {pwMsg && <p className="text-sm text-green-500">{pwMsg}</p>}
          {pwError && <p className="text-sm text-red-500">{pwError}</p>}
        </form>
      </div>
    </Section>
  )
}

function AdminUserManagement() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingLimit, setEditingLimit] = useState(null)
  const [limitInput, setLimitInput] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_users_for_admin')
    if (!error) setUsers(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleBan = async (userId) => {
    await supabase.rpc('ban_user', { target_user_id: userId })
    fetchUsers()
  }

  const handleUnban = async (userId) => {
    await supabase.rpc('unban_user', { target_user_id: userId })
    fetchUsers()
  }

  const handleSetRole = async (userId, role) => {
    await supabase.rpc('set_user_role', { target_user_id: userId, new_role: role })
    fetchUsers()
  }

  const handleSetLimit = async (userId) => {
    const val = parseInt(limitInput)
    if (isNaN(val) || val < 0) return
    await supabase.rpc('set_max_files', { target_user_id: userId, new_limit: val })
    setEditingLimit(null)
    setLimitInput('')
    fetchUsers()
  }

  const handleClearLimit = async (userId) => {
    await supabase.rpc('set_max_files', { target_user_id: userId, new_limit: -1 })
    setEditingLimit(null)
    fetchUsers()
  }

  if (loading) return <Section title="用户管理"><p className="text-sm text-gray-400">加载中...</p></Section>

  const currentUserId = user?.id

  return (
    <Section title="用户管理">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="pb-2 font-medium">邮箱</th>
              <th className="pb-2 font-medium">角色</th>
              <th className="pb-2 font-medium">状态</th>
              <th className="pb-2 font-medium">文件</th>
              <th className="pb-2 font-medium">限额</th>
              <th className="pb-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700/50">
                <td className="py-2.5 text-gray-900 dark:text-white max-w-[180px] truncate">{u.email}</td>
                <td className="py-2.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    u.role === 'admin'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {u.role === 'admin' ? '管理员' : '用户'}
                  </span>
                </td>
                <td className="py-2.5">
                  {u.is_banned ? (
                    <span className="text-red-500 text-xs">已封禁</span>
                  ) : (
                    <span className="text-green-500 text-xs">正常</span>
                  )}
                </td>
                <td className="py-2.5 text-gray-600 dark:text-gray-400">{u.file_count}</td>
                <td className="py-2.5">
                  {editingLimit === u.id ? (
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={limitInput}
                        onChange={e => setLimitInput(e.target.value)}
                        className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        autoFocus
                      />
                      <button onClick={() => handleSetLimit(u.id)} className="text-xs text-blue-500 hover:text-blue-600 cursor-pointer">确定</button>
                      <button onClick={() => { setEditingLimit(null); handleClearLimit(u.id) }} className="text-xs text-gray-400 hover:text-gray-500 cursor-pointer">不限</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingLimit(u.id); setLimitInput(u.max_files != null && u.max_files >= 0 ? String(u.max_files) : '') }}
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-500 text-xs cursor-pointer"
                    >
                      {u.max_files != null && u.max_files >= 0 ? u.max_files : '不限'}
                    </button>
                  )}
                </td>
                <td className="py-2.5">
                  <div className="flex gap-2">
                    {u.role !== 'admin' && (
                      <>
                        {u.is_banned ? (
                          <button onClick={() => handleUnban(u.id)} className="text-xs text-green-500 hover:text-green-600 cursor-pointer">解封</button>
                        ) : (
                          <button onClick={() => handleBan(u.id)} className="text-xs text-red-500 hover:text-red-600 cursor-pointer">封禁</button>
                        )}
                        <button onClick={() => handleSetRole(u.id, 'admin')} className="text-xs text-purple-500 hover:text-purple-600 cursor-pointer">升级</button>
                      </>
                    )}
                    {u.role === 'admin' && u.id !== currentUserId && (
                      <button onClick={() => handleSetRole(u.id, 'user')} className="text-xs text-orange-500 hover:text-orange-600 cursor-pointer">降级</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

function RegistrationSettings() {
  const { settings, updateRegistrationMode } = useSettings()
  const [saving, setSaving] = useState(false)

  const handleChange = async (mode) => {
    setSaving(true)
    await updateRegistrationMode(mode)
    setSaving(false)
  }

  const modes = [
    { value: 'public', label: '公开', desc: '任何人都可以注册' },
    { value: 'restricted', label: '受限', desc: '需要邀请码才能注册' },
    { value: 'private', label: '私密', desc: '不开放注册' },
  ]

  return (
    <Section title="注册设置">
      <div className="space-y-3">
        {modes.map(m => (
          <label
            key={m.value}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              settings?.registration_mode === m.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <input
              type="radio"
              name="registration_mode"
              value={m.value}
              checked={settings?.registration_mode === m.value}
              onChange={() => handleChange(m.value)}
              disabled={saving}
              className="accent-blue-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{m.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{m.desc}</p>
            </div>
          </label>
        ))}
      </div>
    </Section>
  )
}

function InviteCodeManager() {
  const { codes, loading, generateCode, revokeCode } = useInviteCodes()
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    await generateCode(7)
    setGenerating(false)
  }

  const copyLink = (code) => {
    const link = `${window.location.origin}/register?invite=${code}`
    navigator.clipboard.writeText(link)
  }

  if (loading) return <Section title="邀请码"><p className="text-sm text-gray-400">加载中...</p></Section>

  return (
    <Section title="邀请码">
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          生成的邀请码有效期为 7 天，每个码只能使用一次
        </p>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors cursor-pointer"
        >
          {generating ? '生成中...' : '生成邀请码'}
        </button>

        {codes.length === 0 ? (
          <p className="text-sm text-gray-400">暂无邀请码</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 font-medium">邀请码</th>
                  <th className="pb-2 font-medium">状态</th>
                  <th className="pb-2 font-medium">创建时间</th>
                  <th className="pb-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {codes.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="py-2.5 font-mono text-gray-900 dark:text-white text-xs">{c.code}</td>
                    <td className="py-2.5">
                      {c.used_by ? (
                        <span className="text-gray-400 text-xs">已使用</span>
                      ) : !c.is_active ? (
                        <span className="text-red-400 text-xs">已作废</span>
                      ) : c.expires_at && new Date(c.expires_at) < new Date() ? (
                        <span className="text-orange-400 text-xs">已过期</span>
                      ) : (
                        <span className="text-green-500 text-xs">有效</span>
                      )}
                    </td>
                    <td className="py-2.5 text-gray-500 text-xs">
                      {new Date(c.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="py-2.5">
                      <div className="flex gap-2">
                        {!c.used_by && c.is_active && (
                          <button
                            onClick={() => copyLink(c.code)}
                            className="text-xs text-blue-500 hover:text-blue-600 cursor-pointer"
                          >
                            复制链接
                          </button>
                        )}
                        {c.is_active && !c.used_by && (
                          <button
                            onClick={() => revokeCode(c.id)}
                            className="text-xs text-red-500 hover:text-red-600 cursor-pointer"
                          >
                            作废
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Section>
  )
}
