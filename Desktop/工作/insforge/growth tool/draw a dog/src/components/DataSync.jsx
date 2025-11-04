import { useState, useEffect } from 'react';
import { insforge } from '../lib/insforgeClient';

/**
 * DataSync - 手动检查并同步 localStorage 数据到 Insforge
 */
export default function DataSync() {
  const [localData, setLocalData] = useState({
    dogs: [],
    users: [],
    images: {},
    hasData: false
  });
  const [status, setStatus] = useState('idle'); // idle, checking, syncing, done, error
  const [progress, setProgress] = useState('');
  const [stats, setStats] = useState({
    dogsCount: 0,
    usersCount: 0,
    imagesCount: 0
  });
  const [insforgeData, setInsforgeData] = useState({
    dogs: [],
    loading: false
  });
  const [showDetails, setShowDetails] = useState(false);
  const [allLocalStorageKeys, setAllLocalStorageKeys] = useState([]);

  // 检查 localStorage 数据
  const checkLocalStorage = () => {
    try {
      setStatus('checking');
      setProgress('正在检查 localStorage...');

      // 检查所有可能的 localStorage 键
      const allKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) allKeys.push(key);
      }

      console.log('🔍 所有 localStorage 键:', allKeys);

      const dogsData = localStorage.getItem('mock_db_dogs');
      const usersData = localStorage.getItem('mock_db_app_users');
      const storageData = localStorage.getItem('mock_storage_dog-images');

      let dogs = [];
      let users = [];
      let images = {};

      // 安全地解析 JSON
      try {
        if (dogsData) {
          dogs = JSON.parse(dogsData);
          if (!Array.isArray(dogs)) {
            console.warn('⚠️ mock_db_dogs 不是数组格式，尝试转换...');
            dogs = [];
          }
        }
      } catch (err) {
        console.error('❌ 解析 mock_db_dogs 失败:', err);
        setProgress(`解析 dogs 数据失败: ${err.message}`);
      }

      try {
        if (usersData) {
          users = JSON.parse(usersData);
          if (!Array.isArray(users)) {
            console.warn('⚠️ mock_db_app_users 不是数组格式，尝试转换...');
            users = [];
          }
        }
      } catch (err) {
        console.error('❌ 解析 mock_db_app_users 失败:', err);
        setProgress(`解析 users 数据失败: ${err.message}`);
      }

      try {
        if (storageData) {
          images = JSON.parse(storageData);
          if (typeof images !== 'object' || Array.isArray(images)) {
            console.warn('⚠️ mock_storage_dog-images 不是对象格式');
            images = {};
          }
        }
      } catch (err) {
        console.error('❌ 解析 mock_storage_dog-images 失败:', err);
        setProgress(`解析 images 数据失败: ${err.message}`);
      }

      const hasData = dogs.length > 0 || users.length > 0 || Object.keys(images).length > 0;

      setLocalData({ dogs, users, images, hasData });
      setStats({
        dogsCount: dogs.length,
        usersCount: users.length,
        imagesCount: Object.keys(images).length
      });

      setStatus('idle');
      
      if (hasData) {
        setProgress(`✅ 检查完成！找到 ${dogs.length} 只狗，${users.length} 个用户，${Object.keys(images).length} 张图片`);
      } else {
        // 检查是否已经迁移过
        const migrated = localStorage.getItem('insforge_migrated');
        if (migrated === 'true') {
          setProgress('ℹ️ 未发现需要同步的数据（可能已经迁移过）。请点击"检查 Insforge 数据库"查看云端数据');
        } else {
          setProgress('ℹ️ 未发现需要同步的数据。请先绘制并保存一些狗，然后再检查');
        }
      }

      console.log('📊 LocalStorage 数据统计:', {
        dogs: dogs.length,
        users: users.length,
        images: Object.keys(images).length,
        allKeys: allKeys.filter(k => k.startsWith('mock_') || k.startsWith('dog_'))
      });

      // 显示所有相关的 localStorage 键
      const relevantKeys = allKeys.filter(k => 
        k.includes('mock') || 
        k.includes('dog') || 
        k.includes('user') ||
        k.includes('insforge')
      );
      
      setAllLocalStorageKeys(relevantKeys);
      
      if (relevantKeys.length > 0) {
        console.log('📋 相关的 localStorage 键:', relevantKeys);
        
        // 尝试检查每个键的内容
        relevantKeys.forEach(key => {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const parsed = JSON.parse(value);
              console.log(`  📦 ${key}:`, Array.isArray(parsed) ? `数组，${parsed.length} 项` : 
                                    typeof parsed === 'object' ? `对象，${Object.keys(parsed).length} 个键` :
                                    typeof parsed);
            }
          } catch (e) {
            console.log(`  📦 ${key}: 非 JSON 数据`);
          }
        });
      }

      // 如果没有找到标准键，尝试查找其他可能的数据
      if (!hasData && allKeys.length > 0) {
        console.log('⚠️ 未找到标准数据键，列出所有 localStorage 键供参考:');
        allKeys.forEach(key => {
          const value = localStorage.getItem(key);
          const preview = value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : '(空)';
          console.log(`  - ${key}: ${preview}`);
        });
      }

    } catch (err) {
      console.error('❌ 检查 localStorage 时出错:', err);
      setStatus('error');
      setProgress(`检查失败: ${err.message}`);
    }
  };

  // 检查 Insforge 数据库中的照片
  const checkInsforgeDatabase = async () => {
    setInsforgeData({ dogs: [], loading: true });
    setProgress('正在检查 Insforge 数据库...');

    try {
      const { data, error } = await insforge.database
        .from('dogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('查询失败:', error);
        setProgress(`查询失败: ${error.message}`);
        setInsforgeData({ dogs: [], loading: false });
        return;
      }

      const dogs = data || [];
      setInsforgeData({ dogs, loading: false });
      setProgress(`找到 ${dogs.length} 条记录`);

      console.log('📊 Insforge 数据库中的照片:', dogs);
    } catch (err) {
      console.error('检查失败:', err);
      setProgress(`检查失败: ${err.message}`);
      setInsforgeData({ dogs: [], loading: false });
    }
  };

  // 从 mock_storage_dog-images 中查找图片
  const findImageInStorage = (dog) => {
    if (!localData.images || Object.keys(localData.images).length === 0) {
      return null;
    }

    // 尝试多种匹配方式
    // 1. 如果 image_url 是文件名，直接查找
    if (dog.image_url && !dog.image_url.startsWith('data:') && !dog.image_url.startsWith('http')) {
      if (localData.images[dog.image_url]) {
        return localData.images[dog.image_url];
      }
    }

    // 2. 尝试根据 dog.id 或 user_id 匹配文件名
    const possibleKeys = Object.keys(localData.images);
    for (const key of possibleKeys) {
      if (key.includes(dog.id) || key.includes(dog.user_id)) {
        return localData.images[key];
      }
    }

    // 3. 如果只有一个图片，直接使用
    if (possibleKeys.length === 1) {
      return localData.images[possibleKeys[0]];
    }

    return null;
  };

  // 检查是否已存在相同的记录（避免重复上传）
  const checkDuplicate = async (dog) => {
    try {
      // 检查是否有相同 user_id、score 和创建时间的记录
      const { data, error } = await insforge.database
        .from('dogs')
        .select('id')
        .eq('user_id', dog.user_id)
        .eq('score', dog.score)
        .gte('created_at', new Date(new Date(dog.created_at).getTime() - 1000).toISOString())
        .lte('created_at', new Date(new Date(dog.created_at).getTime() + 1000).toISOString())
        .limit(1);

      if (error) {
        console.warn('检查重复记录时出错:', error);
        return false; // 出错时继续上传，让数据库去重
      }

      return data && data.length > 0;
    } catch (err) {
      console.warn('检查重复记录时出错:', err);
      return false;
    }
  };

  // 将 base64 data URL 转换为 Blob
  const dataURLtoBlob = async (dataURL) => {
    if (dataURL.startsWith('data:')) {
      const response = await fetch(dataURL);
      return await response.blob();
    }
    return null;
  };

  // 同步数据到 Insforge
  const syncToInsforge = async () => {
    if (!localData.hasData) {
      alert('没有发现需要同步的数据');
      return;
    }

    // 检查是否连接到真实的 Insforge 后端
    const baseUrl = import.meta.env.VITE_INSFORGE_BASE_URL;
    const hasValidBaseUrl = baseUrl && 
      baseUrl !== 'https://your-instance.insforge.app' && 
      baseUrl.startsWith('http');
    
    if (!hasValidBaseUrl) {
      const confirmSync = confirm(
        '⚠️ 警告：未检测到 Insforge 后端配置！\n\n' +
        '当前使用的是 Mock 客户端（数据存储在 localStorage）。\n\n' +
        '要同步到真实的 Insforge 后端，请：\n' +
        '1. 创建 .env 文件\n' +
        '2. 添加 VITE_INSFORGE_BASE_URL=你的后端地址\n' +
        '3. 重启开发服务器\n\n' +
        '是否继续尝试同步？（可能会失败）'
      );
      if (!confirmSync) {
        return;
      }
    }

    setStatus('syncing');
    setProgress('开始同步数据到 Insforge...');

    try {
      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      // 步骤 1: 同步用户
      if (localData.users.length > 0) {
        setProgress(`正在同步 ${localData.users.length} 个用户...`);
        for (let i = 0; i < localData.users.length; i++) {
          const user = localData.users[i];
          setProgress(`正在同步用户 ${i + 1}/${localData.users.length}...`);
          try {
            const { error } = await insforge.database
              .from('app_users')
              .insert([{
                id: user.id,
                created_at: user.created_at,
                last_seen: user.last_seen || user.created_at
              }]);

            if (error) {
              // 忽略重复用户错误
              if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
                console.log('用户已存在，跳过:', user.id);
                skippedCount++;
              } else {
                console.error('迁移用户失败:', error);
                errorCount++;
              }
            } else {
              successCount++;
            }
          } catch (err) {
            console.error('迁移用户失败:', err);
            errorCount++;
          }
        }
      }

      // 步骤 2: 同步狗和图片
      if (localData.dogs.length > 0) {
        setProgress(`正在同步 ${localData.dogs.length} 只狗...`);
        
        for (let i = 0; i < localData.dogs.length; i++) {
          const dog = localData.dogs[i];
          setProgress(`正在同步狗 ${i + 1}/${localData.dogs.length} (${dog.id?.substring(0, 8)}...)...`);

          try {
            // 检查是否已存在（避免重复上传）
            const isDuplicate = await checkDuplicate(dog);
            if (isDuplicate) {
              console.log('狗已存在，跳过:', dog.id);
              skippedCount++;
              continue;
            }

            // 获取图片数据
            let imageBlob = null;
            let imageDataURL = null;

            // 方式 1: 如果 image_url 是 data URL
            if (dog.image_url && dog.image_url.startsWith('data:')) {
              imageDataURL = dog.image_url;
              imageBlob = await dataURLtoBlob(dog.image_url);
            }
            // 方式 2: 如果 image_url 是 URL，尝试获取
            else if (dog.image_url && dog.image_url.startsWith('http')) {
              try {
                const response = await fetch(dog.image_url);
                imageBlob = await response.blob();
              } catch (err) {
                console.warn('无法从 URL 获取图片，尝试从 storage 查找:', err);
                // 继续尝试从 storage 查找
              }
            }
            
            // 方式 3: 从 mock_storage_dog-images 中查找
            if (!imageBlob) {
              const storageImage = findImageInStorage(dog);
              if (storageImage) {
                imageDataURL = storageImage;
                imageBlob = await dataURLtoBlob(storageImage);
              }
            }

            // 如果仍然没有找到图片
            if (!imageBlob) {
              console.warn('无法找到狗的图片，尝试直接保存元数据:', dog.id);
              // 尝试直接保存（如果有 image_url）
              if (dog.image_url) {
                const { error: dbError } = await insforge.database
                  .from('dogs')
                  .insert([{
                    user_id: dog.user_id,
                    image_url: dog.image_url,
                    score: dog.score,
                    likes: dog.likes || 0,
                    dislikes: dog.dislikes || 0,
                    created_at: dog.created_at
                  }]);

                if (dbError) {
                  console.error('数据库插入失败:', dbError);
                  errorCount++;
                } else {
                  successCount++;
                }
              } else {
                console.warn('狗没有图片 URL，跳过:', dog.id);
                errorCount++;
              }
              continue;
            }

            // 上传图片到 Insforge Storage
            const timestamp = Date.now();
            const filename = `migrated_${dog.user_id}_${timestamp}_${i}.png`;
            setProgress(`正在上传图片 ${i + 1}/${localData.dogs.length}...`);
            
            const { data: uploadData, error: uploadError } = await insforge.storage
              .from('dog-images')
              .upload(filename, imageBlob);

            if (uploadError) {
              console.error('图片上传失败:', uploadError);
              errorCount++;
              continue;
            }

            // 获取上传后的 URL
            const imageUrl = uploadData?.url || uploadData?.data?.url || uploadData;
            if (!imageUrl) {
              console.error('上传后未返回图片 URL');
              errorCount++;
              continue;
            }

            // 保存到数据库
            setProgress(`正在保存到数据库 ${i + 1}/${localData.dogs.length}...`);
            const { error: dbError } = await insforge.database
              .from('dogs')
              .insert([{
                user_id: dog.user_id,
                image_url: imageUrl,
                score: dog.score,
                likes: dog.likes || 0,
                dislikes: dog.dislikes || 0,
                created_at: dog.created_at
              }]);

            if (dbError) {
              // 检查是否是重复错误
              if (dbError.message?.includes('duplicate') || dbError.message?.includes('unique')) {
                console.log('狗已存在（数据库约束），跳过:', dog.id);
                skippedCount++;
              } else {
                console.error('数据库插入失败:', dbError);
                errorCount++;
              }
            } else {
              successCount++;
            }
          } catch (err) {
            console.error('迁移失败:', err);
            errorCount++;
          }
        }
      }

      // 同步完成
      const summary = `同步完成！✅ 成功: ${successCount}，⏭️ 跳过: ${skippedCount}，❌ 失败: ${errorCount}`;
      setProgress(summary);
      setStatus('done');

      // 刷新数据检查
      setTimeout(() => {
        checkLocalStorage();
        // 自动检查 Insforge 数据库以显示同步后的数据
        checkInsforgeDatabase();
      }, 1000);

    } catch (err) {
      console.error('同步失败:', err);
      setStatus('error');
      setProgress(`同步失败: ${err.message}`);
    }
  };

  // 清理 localStorage
  const clearLocalStorage = () => {
    if (!confirm('⚠️ 确定要清除所有 localStorage 数据吗？请确保同步已完成！')) {
      return;
    }

    localStorage.removeItem('mock_db_dogs');
    localStorage.removeItem('mock_db_app_users');
    localStorage.removeItem('mock_storage_dog-images');
    localStorage.removeItem('insforge_migrated'); // 也清除迁移标记，允许重新迁移

    checkLocalStorage();
    alert('✅ LocalStorage 已清理！');
  };

  // 组件加载时自动检查
  useEffect(() => {
    checkLocalStorage();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      zIndex: 1000,
      minWidth: '300px',
      maxWidth: '400px'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>
        📊 数据同步工具
      </h3>

      {/* 数据统计 */}
      <div style={{ marginBottom: '15px', fontSize: '14px' }}>
        <div style={{ marginBottom: '8px', padding: '8px', background: '#f0f7ff', borderRadius: '6px' }}>
          <strong style={{ color: '#667eea' }}>📦 LocalStorage:</strong>
          <div style={{ marginLeft: '10px', marginTop: '4px' }}>
            <div>🐕 狗: {stats.dogsCount}</div>
            <div>👤 用户: {stats.usersCount}</div>
            <div>🖼️ 图片: {stats.imagesCount}</div>
          </div>
          {allLocalStorageKeys.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>
              <details>
                <summary style={{ cursor: 'pointer' }}>🔍 查看所有相关键 ({allLocalStorageKeys.length})</summary>
                <div style={{ marginTop: '4px', padding: '4px', background: 'white', borderRadius: '4px' }}>
                  {allLocalStorageKeys.map(key => {
                    try {
                      const value = localStorage.getItem(key);
                      const size = value ? `(${Math.round(value.length / 1024)}KB)` : '';
                      return (
                        <div key={key} style={{ marginBottom: '2px', fontSize: '10px' }}>
                          • {key} {size}
                        </div>
                      );
                    } catch (e) {
                      return <div key={key} style={{ fontSize: '10px' }}>• {key}</div>;
                    }
                  })}
                </div>
              </details>
            </div>
          )}
          
          {/* 存储位置说明 */}
          <div style={{ marginTop: '8px', padding: '6px', background: '#f9f9f9', borderRadius: '4px', fontSize: '10px', color: '#666' }}>
            <strong>💾 存储位置说明：</strong>
            <div style={{ marginTop: '4px' }}>
              <div>• <code>mock_db_dogs</code> - 狗的数据（包含图片URL）</div>
              <div>• <code>mock_storage_dog-images</code> - 图片文件（base64）</div>
              <div>• <code>mock_db_app_users</code> - 用户数据</div>
              <div style={{ marginTop: '4px', color: '#999' }}>
                如果使用真实 Insforge 后端，数据存储在云端，不在 localStorage
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: '8px', padding: '8px', background: '#f0fdf4', borderRadius: '6px' }}>
          <strong style={{ color: '#48bb78' }}>☁️ Insforge 数据库:</strong>
          <div style={{ marginLeft: '10px', marginTop: '4px' }}>
            <div>🐕 狗: {insforgeData.dogs.length}</div>
            {insforgeData.loading && <div style={{ color: '#999' }}>⏳ 检查中...</div>}
            {!insforgeData.loading && insforgeData.dogs.length === 0 && stats.dogsCount === 0 && (
              <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                💡 提示：如果本地和云端都没有数据，请先画一只狗
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 状态显示 */}
      {progress && (
        <div style={{
          padding: '10px',
          background: status === 'checking' ? '#fff3cd' : 
                      status === 'syncing' ? '#e3f2fd' :
                      status === 'done' ? '#e8f5e9' :
                      status === 'error' ? '#ffebee' : '#f0f0f0',
          borderRadius: '8px',
          marginBottom: '10px',
          fontSize: '13px',
          color: status === 'done' ? '#2e7d32' :
                 status === 'error' ? '#c62828' :
                 status === 'checking' ? '#856404' : '#333',
          border: status === 'error' ? '1px solid #f56565' : 'none',
          wordBreak: 'break-word'
        }}>
          {status === 'checking' && '⏳ '}
          {status === 'syncing' && '🔄 '}
          {status === 'done' && '✅ '}
          {status === 'error' && '❌ '}
          {progress}
        </div>
      )}

      {/* 详情展开/收起 */}
      {(localData.dogs.length > 0 || insforgeData.dogs.length > 0) && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            padding: '8px',
            background: '#f0f0f0',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            marginBottom: '10px',
            width: '100%'
          }}
        >
          {showDetails ? '▲ 隐藏详情' : '▼ 显示照片详情'}
        </button>
      )}

      {/* 照片详情 */}
      {showDetails && (
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto',
          marginBottom: '10px',
          padding: '10px',
          background: '#f9f9f9',
          borderRadius: '8px',
          fontSize: '12px'
        }}>
          {/* LocalStorage 照片 */}
          {localData.dogs.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ display: 'block', marginBottom: '8px', color: '#667eea' }}>
                📦 LocalStorage 中的照片 ({localData.dogs.length})
              </strong>
              {localData.dogs.slice(0, 10).map((dog, idx) => {
                const imageSize = dog.image_url?.startsWith('data:') 
                  ? Math.round((dog.image_url.length * 3) / 4 / 1024) + ' KB'
                  : 'URL';
                return (
                  <div key={idx} style={{
                    padding: '8px',
                    marginBottom: '6px',
                    background: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div><strong>ID:</strong> {dog.id?.substring(0, 8)}...</div>
                    <div><strong>分数:</strong> {Math.round((dog.score || 0) * 100)}%</div>
                    <div><strong>图片:</strong> {dog.image_url?.substring(0, 50)}...</div>
                    <div><strong>大小:</strong> {imageSize}</div>
                    {dog.image_url?.startsWith('data:') && (
                      <img 
                        src={dog.image_url} 
                        alt={`Dog ${idx + 1}`}
                        style={{
                          maxWidth: '100px',
                          maxHeight: '100px',
                          marginTop: '4px',
                          borderRadius: '4px'
                        }}
                      />
                    )}
                  </div>
                );
              })}
              {localData.dogs.length > 10 && (
                <div style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>
                  ...还有 {localData.dogs.length - 10} 张照片
                </div>
              )}
            </div>
          )}

          {/* Insforge 数据库照片 */}
          {insforgeData.dogs.length > 0 && (
            <div>
              <strong style={{ display: 'block', marginBottom: '8px', color: '#48bb78' }}>
                ☁️ Insforge 数据库中的照片 ({insforgeData.dogs.length})
              </strong>
              {insforgeData.dogs.slice(0, 10).map((dog, idx) => (
                <div key={dog.id} style={{
                  padding: '8px',
                  marginBottom: '6px',
                  background: 'white',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0'
                }}>
                  <div><strong>ID:</strong> {dog.id?.substring(0, 8)}...</div>
                  <div><strong>分数:</strong> {Math.round((dog.score || 0) * 100)}%</div>
                  <div><strong>点赞:</strong> {dog.likes || 0} | <strong>点踩:</strong> {dog.dislikes || 0}</div>
                  <div><strong>图片URL:</strong> {dog.image_url?.substring(0, 60)}...</div>
                  <div><strong>创建时间:</strong> {new Date(dog.created_at).toLocaleString()}</div>
                  {dog.image_url && !dog.image_url.startsWith('data:') && (
                    <img 
                      src={dog.image_url} 
                      alt={`Dog ${idx + 1}`}
                      style={{
                        maxWidth: '100px',
                        maxHeight: '100px',
                        marginTop: '4px',
                        borderRadius: '4px'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              ))}
              {insforgeData.dogs.length > 10 && (
                <div style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>
                  ...还有 {insforgeData.dogs.length - 10} 张照片
                </div>
              )}
            </div>
          )}

          {localData.dogs.length === 0 && insforgeData.dogs.length === 0 && (
            <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              暂无照片数据
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={checkLocalStorage}
          disabled={status === 'syncing'}
          style={{
            padding: '10px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: status === 'syncing' ? 'not-allowed' : 'pointer',
            opacity: status === 'syncing' ? 0.6 : 1,
            fontWeight: 'bold'
          }}
        >
          🔍 检查 LocalStorage
        </button>

        <button
          onClick={checkInsforgeDatabase}
          disabled={status === 'syncing' || insforgeData.loading}
          style={{
            padding: '10px',
            background: '#4299e1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: (status === 'syncing' || insforgeData.loading) ? 'not-allowed' : 'pointer',
            opacity: (status === 'syncing' || insforgeData.loading) ? 0.6 : 1,
            fontWeight: 'bold'
          }}
        >
          {insforgeData.loading ? '⏳ 检查中...' : '☁️ 检查 Insforge 数据库'}
        </button>

        <button
          onClick={syncToInsforge}
          disabled={status === 'syncing' || !localData.hasData}
          style={{
            padding: '10px',
            background: localData.hasData ? '#48bb78' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: (status === 'syncing' || !localData.hasData) ? 'not-allowed' : 'pointer',
            opacity: (status === 'syncing' || !localData.hasData) ? 0.6 : 1,
            fontWeight: 'bold'
          }}
          title={!localData.hasData ? '没有可同步的数据。请先绘制并保存一些狗' : '将本地数据同步到 Insforge'}
        >
          🚀 同步到 Insforge
        </button>

        {/* 提示信息 */}
        {!localData.hasData && localStorage.getItem('insforge_migrated') === 'true' && (
          <div style={{
            padding: '8px',
            background: '#fff3cd',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#856404',
            marginTop: '4px'
          }}>
            💡 检测到迁移标记，数据可能已在云端。请点击"☁️ 检查 Insforge 数据库"查看
          </div>
        )}

        {localData.hasData && (
          <button
            onClick={clearLocalStorage}
            disabled={status === 'syncing'}
            style={{
              padding: '10px',
              background: '#f56565',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: status === 'syncing' ? 'not-allowed' : 'pointer',
              opacity: status === 'syncing' ? 0.6 : 1,
              fontSize: '13px'
            }}
          >
            🗑️ 清理 LocalStorage
          </button>
        )}
      </div>
    </div>
  );
}

