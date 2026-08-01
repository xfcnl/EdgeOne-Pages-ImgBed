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
VITE_ADMIN_EMAIL=your-admin@example.com
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=edgeone-pages-imgbed
```

3. 运行数据库迁移：

```bash
supabase migration up
```

4. 启动开发服务器（开发端口固定为 3000，与 `config.toml` 的 site_url 对齐）：

```bash
pnpm dev
```

> 邮箱验证已在 `supabase/config.toml` 开启（`enable_confirmations = true`），注册后
> 需点击邮件里的验证链接才能登录。本地开发不会真的发信，验证邮件会进入测试收件箱
> [inbucket](http://localhost:54324)，打开该地址即可看到。

### 环境变量

| 变量                          | 用途                                                              | 示例                              |
| ----------------------------- | ----------------------------------------------------------------- | --------------------------------- |
| `VITE_SUPABASE_URL`           | Supabase 项目 URL（前端 + Edge Function）                         | `https://xxxx.supabase.co`        |
| `VITE_SUPABASE_ANON_KEY`      | 前端公开的 anon key（`sb_publishable_` 开头）                     | `sb_publishable_xxx`              |
| `VITE_ADMIN_EMAIL`            | 管理员邮箱，用于登录后自动提升角色（必须与账号邮箱**完全一致**）  | `admin@example.com`               |
| `SUPABASE_SERVICE_ROLE_KEY`   | 服务端最高权限 key，仅 Edge Function 使用，**绝不能进前端 bundle** | `sb_secret_xxx`                   |
| `SUPABASE_STORAGE_BUCKET`     | Storage bucket 名称（默认 `edgeone-pages-imgbed`）                | `edgeone-pages-imgbed`            |

### 创建管理员账号

管理员不通过前端自动创建，请在 Supabase 控制台（Authentication → Users）手动注册
一个账号，邮箱必须与 `VITE_ADMIN_EMAIL` **逐字符一致（大小写敏感）**。该账号首次
登录后会自动被提升为 admin 角色；若未生效，可在 SQL Editor 兜底执行：

```sql
INSERT INTO public.profiles (id, role)
SELECT id, 'admin' FROM auth.users WHERE lower(email) = 'g114514g@yeah.net'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

### 部署到 EdgeOne Pages

两种方式任选：

**方式一：本地构建上传**

```bash
pnpm build
pnpm deploy
```

**方式二：EdgeOne 控制台接入 GitHub 仓库**（推荐）

在 EdgeOne Pages 项目配置中开启「连接 GitHub 仓库」自动部署，并把上述 `VITE_` 变量
配置为**构建环境变量**（`VITE_` 前缀是 Vite 约定，非 `VITE_` 开头的变量不会进入
前端产物）。构建环境读取不到仓库根目录的 `.env`（已被 gitignore），所以生产值必须
配在这里。

**部署前还需要：**

1. 把数据库迁移推到云端 Supabase：

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

2. 配置 Supabase 云端 **Authentication → URL Configuration**：
   - Site URL 填真实部署域名（重置密码邮件链接基于它生成）
   - Redirect URLs 添加 `https://你的域名/**`

3. 邮箱验证需要在云端手动开启：Authentication → Providers → Email → **Confirm email**

> 生产环境若报 `Invalid API key`，多半是环境变量没注入或 anon key 复制错误；
> 登录报 `Invalid login credentials`，检查账号是否存在、邮箱是否已验证、`VITE_ADMIN_EMAIL`
> 大小写是否与账号一致。

### 密码重置

目前项目尚未提供独立的「设置新密码」界面：点击重置邮件链接后会直接以 recovery
会话登录，此时请进入 **Settings → 账户设置 → 修改密码** 设置新密码。重置邮件有
速率限制（默认每小时 2 封），连续发送会触发 `邮件速率限制超出` 错误，等待即可。

### 备用：脚本直接改密码

当邮件被限流或无法收件时，可绕过邮件、用 service_role key 直接在后台改密码：

```powershell
$env:VITE_SUPABASE_URL="https://xxxx.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="sb_secret_xxx"
node scripts/set-password.mjs "admin@example.com" "新密码"
```

> 警告：`SUPABASE_SERVICE_ROLE_KEY` 是数据库最高权限，脚本执行完**立即在 Dashboard
> 撤销并重建该 key**。该脚本仅供临时救急，不要长期保留在部署环境中。

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
