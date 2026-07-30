import { useState, useRef } from 'react'

export default function UploadZone({ files, uploading, progress, error, onFilesChange, onUpload, onClear, onClearError }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    onFilesChange(e.dataTransfer.files)
  }

  const handleChange = (e) => {
    if (e.target.files.length > 0) {
      onFilesChange(e.target.files)
    }
    e.target.value = ''
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
      {error && (
        <div className="mx-4 mt-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={onClearError}
            className="p-1 text-red-400 hover:text-red-600 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {files.length > 0 ? (
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              已选择 {files.length} 张图片
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClear}
                disabled={uploading}
                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={onUpload}
                disabled={uploading}
                className="px-4 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
              >
                {uploading ? `上传中 ${progress}%` : '上传'}
              </button>
            </div>
          </div>
          {uploading && (
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {!uploading && (
            <div className="flex gap-2 flex-wrap">
              {Array.from(files).map((file, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            mx-4 my-3 p-6 border-2 border-dashed rounded-xl text-center
            transition-colors duration-200 cursor-pointer
            ${dragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
          `}
        >
          <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            拖拽图片到此处，或点击选择
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            支持 JPG / PNG / GIF / WebP，单张最大 512KB，一次最多 20 张
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}
