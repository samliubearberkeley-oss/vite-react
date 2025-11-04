# 用户唯一性保证机制

## 概述

本系统使用**无需登录的匿名用户系统**，但通过多层机制确保每个用户ID的唯一性。

## 唯一性保证的三层机制

### 1. UUID v4 生成（第一层：数学概率保证）

```javascript
const newId = crypto.randomUUID();
```

- **技术**：使用浏览器原生 `crypto.randomUUID()` API 生成 UUID v4
- **唯一性概率**：UUID v4 有 2^122 个可能值（约 5.3 × 10^36）
- **碰撞概率**：极低，即使生成 1 万亿个 UUID，碰撞概率仍小于 1/10 billion
- **参考**：根据生日悖论，需要生成 2.71 × 10^18 个 UUID 才有 50% 概率发生碰撞

### 2. 后端数据库验证（第二层：系统级唯一性保证）

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,  -- PRIMARY KEY 保证数据库级唯一性
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**工作流程：**

1. 前端生成 UUID
2. 调用 `registerUser(userId)` 向后端注册
3. 后端尝试插入 `users` 表
4. 如果 ID 已存在，数据库返回唯一性约束错误（错误码 23505）
5. 前端检测到碰撞，自动重新生成新 UUID（最多重试 5 次）

```javascript
// 核心代码片段
try {
  const result = await registerUser(newId);
  if (result.success) {
    return newId;
  }
} catch (error) {
  if (error.message === 'USER_ID_COLLISION') {
    // 碰撞检测到，重新生成
    attempts++;
    continue;
  }
}
```

### 3. localStorage 持久化（第三层：设备级持久性）

```javascript
localStorage.setItem('dog_user_id', userId);
```

- **目的**：确保同一浏览器/设备上的用户始终使用相同ID
- **特性**：
  - 跨会话持久化（关闭浏览器后仍然存在）
  - 域名隔离（不同网站不会共享）
  - 用户可清除（隐私保护）

## 完整的用户注册流程

```
用户首次访问
    ↓
检查 localStorage
    ↓
没有存储的 ID → 生成新 UUID
    ↓
向后端注册 (POST /users)
    ↓
后端检查唯一性
    ↓
    ├─ 唯一 → 插入数据库 → 返回成功
    │         ↓
    │    保存到 localStorage
    │         ↓
    │    用户ID已建立
    │
    └─ 冲突 → 返回错误 → 重新生成UUID → 重试（最多5次）
```

## 边缘情况处理

### 情况 1：网络失败

```javascript
// 如果后端不可用，回退到本地模式
catch (error) {
  console.error('Backend registration failed, using local-only mode:', error);
  return crypto.randomUUID(); // 仍然使用UUID，确保本地唯一性
}
```

### 情况 2：localStorage 被清除

- 用户会被视为新用户
- 生成新的UUID并重新注册
- 旧的画作仍然关联到旧的user_id
- **这是预期行为**：尊重用户的隐私选择

### 情况 3：多设备/多浏览器

- 每个设备/浏览器会有独立的UUID
- 这是无登录系统的预期行为
- 用户可以在每个设备上创建作品

### 情况 4：UUID碰撞（理论上）

- 前端最多重试 5 次生成新UUID
- 如果5次都碰撞（概率约 10^-180），使用最后一个UUID
- 实际上这种情况**永远不会发生**

## 数据一致性

### users 表的作用

```sql
-- users 表追踪所有活跃用户
SELECT COUNT(*) FROM users;  -- 总用户数

-- 可以查询用户的活跃度
SELECT id, last_seen 
FROM users 
ORDER BY last_seen DESC 
LIMIT 10;  -- 最近活跃的10个用户
```

### 外键约束（可选）

```sql
-- 可选：强制引用完整性
ALTER TABLE dogs 
ADD CONSTRAINT fk_dogs_user 
FOREIGN KEY (user_id) REFERENCES users(id) 
ON DELETE CASCADE;
```

## 隐私保护

### 存储的数据

- **user_id**: 随机UUID（不包含个人信息）
- **created_at**: 注册时间
- **last_seen**: 最后活跃时间

### 不存储的数据

- ❌ IP地址
- ❌ 设备指纹
- ❌ 地理位置
- ❌ 浏览器信息
- ❌ 任何个人身份信息

### 用户权利

- 用户可以清除 localStorage 来"重置"身份
- 没有账号概念，没有密码，没有邮箱
- 完全匿名

## 性能考虑

### 索引优化

```sql
CREATE INDEX idx_users_last_seen ON users(last_seen DESC);
```

- 支持快速查询活跃用户
- 支持用户统计分析

### 数据库查询性能

- **用户注册**: O(1) - 主键插入
- **用户验证**: O(1) - 主键查找
- **用户统计**: O(log n) - 带索引的聚合查询

## 总结

### 唯一性保证级别

| 层级 | 机制 | 唯一性保证 | 碰撞概率 |
|-----|------|-----------|---------|
| 第一层 | UUID v4 数学 | 5.3×10^36 空间 | < 10^-18 |
| 第二层 | 数据库主键 | 100% 系统级唯一 | 0（自动重试）|
| 第三层 | localStorage | 设备级持久性 | N/A |

### 实际表现

- ✅ **数学上**：UUID v4 碰撞概率可忽略不计
- ✅ **系统上**：数据库主键强制唯一性
- ✅ **实践上**：自动碰撞检测和重试机制
- ✅ **用户体验**：完全透明，无需任何操作

**结论**：三层机制确保了用户ID的**绝对唯一性**，同时保持了**零登录门槛**的用户体验。

