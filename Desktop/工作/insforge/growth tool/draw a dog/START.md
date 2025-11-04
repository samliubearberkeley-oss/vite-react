# 🚀 启动应用

## 快速启动

在终端中运行：

```bash
cd "/Users/liujiekun/Desktop/工作/insforge/growth tool/draw a dog"
npm run dev
```

然后打开浏览器访问显示的 URL（通常是 http://localhost:3000）

## 会发生什么

1. **自动迁移** - 如果 localStorage 中有旧数据，会自动迁移到 Insforge
2. **显示进度** - 迁移时会显示进度窗口
3. **自动完成** - 迁移完成后3秒自动刷新
4. **正常使用** - 所有数据现在都保存在 Insforge 后端

## 配置确认

✅ `.env` 文件已配置:
- `VITE_INSFORGE_BASE_URL=https://pqh4hzpa.us-east.insforge.app`

✅ Insforge 后端已配置:
- 数据库表: `app_users`, `dogs`
- Storage: `dog-images` bucket
- RLS: 已禁用 (允许匿名访问)

✅ 自动迁移功能已集成:
- `AutoMigrate` 组件会在应用启动时自动运行
- 只运行一次，迁移后不会重复

## 端口

默认端口: 3000
可在 `vite.config.js` 中修改

