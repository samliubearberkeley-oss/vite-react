# 🚀 Draw a Dog - 完整设置指南

## 步骤 1: 安装依赖

```bash
npm install
```

## 步骤 2: 配置环境变量

创建 `.env` 文件：

```env
VITE_INSFORGE_BASE_URL=https://your-instance.insforge.app
```

## 步骤 3: 设置 Insforge 后端

### 3.1 创建 Storage Bucket

在 Insforge 控制台中：
1. 进入 Storage 页面
2. 创建新 bucket，命名为 `dog-images`
3. 设置为 Public（公开读取）

### 3.2 创建数据库表

#### 如果是新建表（推荐）

在 Insforge SQL 编辑器中执行：

```sql
-- Users table: 存储用户信息，确保用户ID唯一性
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dogs table: 存储狗狗画作
CREATE TABLE dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  image_url TEXT NOT NULL,
  score DECIMAL NOT NULL,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_dogs_user_id ON dogs(user_id);
CREATE INDEX idx_dogs_score ON dogs(score DESC);
CREATE INDEX idx_dogs_created_at ON dogs(created_at DESC);
CREATE INDEX idx_dogs_likes ON dogs(likes DESC);
CREATE INDEX idx_users_last_seen ON users(last_seen DESC);
```

#### 如果已有旧的 dogs 表（迁移）

如果你的 dogs 表没有 `likes` 和 `dislikes` 字段，运行迁移脚本：

```bash
# 在 Insforge SQL 编辑器中执行 migrations/add_likes_dislikes.sql 文件
```

或者手动执行：

```sql
-- Add users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add likes and dislikes columns to dogs
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dogs_likes ON dogs(likes DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen DESC);

-- Update existing rows
UPDATE dogs SET likes = 0 WHERE likes IS NULL;
UPDATE dogs SET dislikes = 0 WHERE dislikes IS NULL;

-- Note: If you want to enforce foreign key constraint, you'll need to:
-- 1. First populate users table with existing user_ids from dogs
-- 2. Then add the constraint: ALTER TABLE dogs ADD CONSTRAINT fk_dogs_user FOREIGN KEY (user_id) REFERENCES users(id);
```

### 3.3 配置 RLS (Row Level Security) [可选]

如果需要，可以添加 RLS 策略：

```sql
-- 启用 RLS for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 允许所有人查看用户
CREATE POLICY "Anyone can view users" ON users
  FOR SELECT USING (true);

-- 允许所有人注册（插入用户）
CREATE POLICY "Anyone can register users" ON users
  FOR INSERT WITH CHECK (true);

-- 允许所有人更新 last_seen
CREATE POLICY "Anyone can update last_seen" ON users
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- 启用 RLS for dogs table
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取所有 dogs
CREATE POLICY "Anyone can view dogs" ON dogs
  FOR SELECT USING (true);

-- 允许所有人插入 dogs
CREATE POLICY "Anyone can insert dogs" ON dogs
  FOR INSERT WITH CHECK (true);

-- 允许所有人更新 likes/dislikes
CREATE POLICY "Anyone can update dogs" ON dogs
  FOR UPDATE USING (true)
  WITH CHECK (true);
```

## 步骤 4: 运行项目

```bash
npm run dev
```

项目将在 `http://localhost:3000` 启动！

## ✅ 验证清单

- [ ] 依赖已安装 (`node_modules` 存在)
- [ ] `.env` 文件已创建并包含 `VITE_INSFORGE_PROJECT_ID`
- [ ] Insforge Storage bucket `dog-images` 已创建
- [ ] 数据库表 `dogs` 已创建
- [ ] 开发服务器成功启动

## 🐛 常见问题

### 问题：上传失败

**解决方案：**
- 检查 Insforge Project ID 是否正确
- 确认 Storage bucket 名称是否为 `dog-images`
- 检查浏览器控制台的错误信息

### 问题：Canvas 无法绘制

**解决方案：**
- 确认 fabric.js 已正确安装
- 检查浏览器控制台是否有错误
- 尝试刷新页面

### 问题：图片无法显示

**解决方案：**
- 确认 Storage bucket 设置为 Public
- 检查图片 URL 是否正确
- 查看网络请求是否有 CORS 错误

## 📝 下一步

项目已准备就绪！现在你可以：

1. **画你的第一只狗** 🎨
2. **查看狗狗乐园** 🏞️
3. **查看排行榜** 🏆
4. **分享你的作品** 📤

享受吧！🐶
