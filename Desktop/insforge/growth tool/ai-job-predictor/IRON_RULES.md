# 🚨 IRON RULES - 铁律

## 🚨 铁律：严禁把图片传到数据库！

### ❌ 严禁行为：
- 在数据库中存储图片的base64编码
- 在数据库中存储二进制图片数据
- 在数据库中存储图片内容
- 任何形式的图片数据存储在数据库表中

### ✅ 正确做法：
- **图片只能存储在Storage buckets中**
- **数据库只能存储文字和相关信息**：
  - Storage URL（如：`https://y3diwbf9.us-east.insforge.app/api/storage/buckets/meme-images/objects/filename.png`）
  - 文字描述
  - 元数据
  - 时间戳
  - 用户信息

### 📋 数据库允许存储的内容：
- ✅ 文本字段（TEXT）
- ✅ 数字字段（INTEGER, NUMERIC）
- ✅ 布尔字段（BOOLEAN）
- ✅ 时间戳（TIMESTAMP）
- ✅ JSON元数据（JSONB）
- ✅ Storage URL（TEXT）
- ✅ 用户ID（UUID）

### 📋 数据库严禁存储的内容：
- ❌ 图片文件
- ❌ Base64编码的图片
- ❌ 二进制数据
- ❌ 任何形式的图片内容

### 🎯 实施位置：
- ✅ `backend/meme-generator.js` - 只返回Storage URL
- ✅ `backend/save-prediction-v2.js` - 只保存Storage URL到数据库
- ✅ `backend/ai-analysis.js` - 只处理文字分析
- ✅ `src/utils/memeGenerator.js` - 只处理Storage URL
- ✅ `src/utils/jobRiskCalculator.js` - 只处理文字数据
- ✅ `backend/schema.sql` - 数据库schema设计

### 🔒 强制执行：
所有代码都必须遵循这个铁律，任何违反此规则的行为都将被拒绝！

---

**记住：图片存Storage，文字存数据库！**

