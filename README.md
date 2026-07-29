# EdgeOne-Pages-ImgBed

基于 **EdgeOne Pages + Supabase** 的全栈图床应用，支持图片上传、管理、分享和相簿分类。

## 技术栈

| 层            | 技术                            |
| ------------- | ------------------------------- |
| 前端框架      | React 19 + React Router v7      |
| 构建工具      | Vite 8                          |
| 样式          | Tailwind CSS v4                 |
| 后端          | EdgeOne Pages Edge Function     |
| 数据库 & 存储 | Supabase (PostgreSQL + Storage) |
| 认证          | Supabase Auth (邮箱密码)        |

## 功能

- **用户认证** — 邮箱注册/登录，会话持久化，路由守卫
- **图片上传** — 点击选择或拖拽上传，文件类型/数量校验，实时进度条，已选文件预览
- **图片画廊** — 响应式网格布局（2~6 列自适应），无限滚动加载
- **图片详情** — 大图预览，文件名/大小/上传时间信息
- **链接复制** — 支持 Direct URL / Markdown / HTML / BBCode / Wikitext 五种格式
- **相簿管理** — 创建/删除相簿，图片归类，侧边栏快捷导航
- **近期上传** — 筛选过去 7 天内上传的图片
- **图片删除** — 同步删除 Storage 文件和数据库记录
- **暗色模式** — 一键切换，`localStorage` 持久化偏好
- **Edge Function** — 服务端图片上传处理，绕过 RLS 限制
- **RLS 数据隔离** — 每张图片/相簿归属用户，多租户安全

## 快速开始

### 前置条件

- Node.js >= 18
- 一个 [Supabase](https://supabase.com) 项目
- [EdgeOne Pages](https://edgeone.cloudflare.com) 部署账号

### 本地开发

1. 克隆仓库并安装依赖：

```bash
git clone https://github.com/xfcnl/EdgeOne-Pages-ImgBed
cd EdgeOne-Pages-ImgBed
pnpm install
```

2. 在项目根目录创建 `.env` 文件：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. 运行数据库迁移：

```bash
supabase migration up
```

4. 启动开发服务器：

```bash
pnpm dev
```

### 部署到 EdgeOne Pages

```bash
pnpm build
pnpm deploy
```

## 数据库表结构

- `images` — 图片元数据（URL、文件名、大小、MIME 类型等）
- `albums` — 相簿（名称、描述）
- `album_images` — 多对多关联（图片 ↔ 相簿）

所有表启用行级安全策略（RLS），用户只能操作自己的数据。

## 项目结构

```
src/
├── pages/          # 页面组件 (Home, Recent, AlbumView, Auth)
├── components/     # UI 组件
│   ├── Gallery/    # 图片网格、详情弹窗
│   ├── Upload/     # 上传区域
│   ├── Albums/     # 相簿相关
│   ├── Layout/     # 布局、侧边栏、顶栏
│   └── Auth/       # 登录/注册表单、路由守卫
├── hooks/          # 自定义 Hooks (useAuth, useImages, useUpload, useAlbums)
├── lib/            # 工具库 (Supabase 客户端)
└── styles/         # 全局样式 (Tailwind 入口)
```

## License

Apache 2.0
