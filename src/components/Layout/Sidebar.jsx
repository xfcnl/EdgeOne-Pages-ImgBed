import { NavLink } from 'react-router-dom'
import { useAlbums } from '../../hooks/useAlbums'
import AlbumCreateDialog from '../Albums/AlbumCreateDialog'
import { useState } from 'react'

export default function Sidebar({ open }) {
  const { albums, loading, createAlbum } = useAlbums()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <aside
      className={`
        ${open ? 'w-56' : 'w-0 overflow-hidden'}
        transition-all duration-300 flex-shrink-0
        bg-sidebar-bg dark:bg-sidebar-bg-dark
        border-r border-gray-200 dark:border-gray-700
        flex flex-col h-full
      `}
    >
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`
          }
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          全部
        </NavLink>

        <NavLink
          to="/recent"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`
          }
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          近期
        </NavLink>

        <div className="my-3 border-t border-gray-200 dark:border-gray-700" />

        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">相簿</span>
          <button
            onClick={() => setShowCreate(true)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="新建相簿"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="px-3 py-2 text-sm text-gray-400">加载中...</div>
        ) : albums.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-400">暂无相簿</div>
        ) : (
          albums.map(album => (
            <NavLink
              key={album.id}
              to={`/albums/${album.id}`}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`
              }
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="truncate">{album.name}</span>
            </NavLink>
          ))
        )}
      </nav>

      {showCreate && (
        <AlbumCreateDialog
          onCreate={async (name, desc) => {
            await createAlbum(name, desc)
            setShowCreate(false)
          }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </aside>
  )
}
