import { useEffect, useState } from 'react';
import { insforge } from '../lib/insforgeClient';

/**
 * AutoMigrate - 自动迁移 localStorage 数据到 Insforge
 * 只在首次加载且检测到 localStorage 有数据时运行
 */
export default function AutoMigrate() {
  const [status, setStatus] = useState('checking'); // checking, migrating, done, error, skip
  const [progress, setProgress] = useState('');

  useEffect(() => {
    const runMigration = async () => {
      // 检查是否已经迁移过
      const migrated = localStorage.getItem('insforge_migrated');
      if (migrated) {
        setStatus('skip');
        return;
      }

      // 检查是否有数据需要迁移
      const dogsData = localStorage.getItem('mock_db_dogs');
      if (!dogsData) {
        setStatus('skip');
        localStorage.setItem('insforge_migrated', 'true');
        return;
      }

      const dogs = JSON.parse(dogsData);
      if (dogs.length === 0) {
        setStatus('skip');
        localStorage.setItem('insforge_migrated', 'true');
        return;
      }

      // 开始迁移
      console.log('🚀 开始自动迁移数据到 Insforge...');
      setStatus('migrating');
      setProgress(`发现 ${dogs.length} 只狗需要迁移`);

      try {
        // 加载图片存储数据
        const storageData = localStorage.getItem('mock_storage_dog-images');
        const images = storageData ? JSON.parse(storageData) : {};

        // 从 mock_storage_dog-images 中查找图片
        const findImageInStorage = (dog) => {
          if (!images || Object.keys(images).length === 0) {
            return null;
          }

          // 尝试多种匹配方式
          if (dog.image_url && !dog.image_url.startsWith('data:') && !dog.image_url.startsWith('http')) {
            if (images[dog.image_url]) {
              return images[dog.image_url];
            }
          }

          const possibleKeys = Object.keys(images);
          for (const key of possibleKeys) {
            if (key.includes(dog.id) || key.includes(dog.user_id)) {
              return images[key];
            }
          }

          if (possibleKeys.length === 1) {
            return images[possibleKeys[0]];
          }

          return null;
        };

        // 将 base64 data URL 转换为 Blob
        const dataURLtoBlob = async (dataURL) => {
          if (dataURL && dataURL.startsWith('data:')) {
            const response = await fetch(dataURL);
            return await response.blob();
          }
          return null;
        };

        // 步骤 1: 迁移用户
        const usersData = localStorage.getItem('mock_db_app_users');
        if (usersData) {
          const users = JSON.parse(usersData);
          setProgress(`迁移 ${users.length} 个用户...`);
          
          for (const user of users) {
            try {
              await insforge.database.from('app_users').insert([{
                id: user.id,
                created_at: user.created_at,
                last_seen: user.last_seen || user.created_at
              }]);
            } catch (err) {
              // 忽略重复用户错误
              if (!err.message?.includes('duplicate') && !err.message?.includes('unique')) {
                console.error('迁移用户失败:', err);
              }
            }
          }
        }

        // 步骤 2: 迁移狗
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < dogs.length; i++) {
          const dog = dogs[i];
          setProgress(`迁移狗 ${i + 1}/${dogs.length}...`);

          try {
            // 获取图片数据
            let imageBlob = null;

            // 方式 1: 如果 image_url 是 data URL
            if (dog.image_url && dog.image_url.startsWith('data:')) {
              imageBlob = await dataURLtoBlob(dog.image_url);
            }
            // 方式 2: 如果 image_url 是 URL，尝试获取
            else if (dog.image_url && dog.image_url.startsWith('http')) {
              try {
                const response = await fetch(dog.image_url);
                imageBlob = await response.blob();
              } catch (err) {
                console.warn('无法从 URL 获取图片，尝试从 storage 查找:', err);
              }
            }
            
            // 方式 3: 从 mock_storage_dog-images 中查找
            if (!imageBlob) {
              const storageImage = findImageInStorage(dog);
              if (storageImage) {
                imageBlob = await dataURLtoBlob(storageImage);
              }
            }

            // 如果仍然没有找到图片
            if (!imageBlob) {
              console.warn('无法找到狗的图片，尝试直接保存元数据:', dog.id);
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
                  if (dbError.message?.includes('duplicate') || dbError.message?.includes('unique')) {
                    skippedCount++;
                  } else {
                    console.error('数据库插入失败:', dbError);
                    errorCount++;
                  }
                } else {
                  successCount++;
                }
              } else {
                errorCount++;
              }
              continue;
            }

            // 上传图片
            const filename = `migrated_${dog.user_id}_${Date.now()}_${i}.png`;
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
              if (dbError.message?.includes('duplicate') || dbError.message?.includes('unique')) {
                console.log('狗已存在，跳过:', dog.id);
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

        // 迁移完成
        const summary = `迁移完成！✅ 成功: ${successCount}，⏭️ 跳过: ${skippedCount}，❌ 失败: ${errorCount}`;
        setProgress(summary);
        setStatus('done');
        
        // 清理 localStorage
        localStorage.removeItem('mock_db_dogs');
        localStorage.removeItem('mock_db_app_users');
        localStorage.removeItem('mock_storage_dog-images');
        localStorage.setItem('insforge_migrated', 'true');

        console.log('✅ 自动迁移完成，localStorage 已清理');
        
        // 3秒后重新加载页面以显示迁移的数据
        setTimeout(() => {
          window.location.reload();
        }, 3000);

      } catch (err) {
        console.error('迁移失败:', err);
        setStatus('error');
        setProgress(`迁移失败: ${err.message}`);
      }
    };

    runMigration();
  }, []);

  // 不显示任何UI，只在后台运行
  if (status === 'skip') return null;

  if (status === 'checking') return null;

  // 显示迁移进度
  if (status === 'migrating' || status === 'done') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          maxWidth: '500px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px', fontFamily: 'Comic Sans MS' }}>
            {status === 'done' ? '🎉 迁移完成！' : '🚀 正在迁移数据...'}
          </h2>
          <p style={{ fontSize: '16px', marginBottom: '20px' }}>
            {progress}
          </p>
          {status === 'done' && (
            <p style={{ fontSize: '14px', color: '#666' }}>
              3秒后自动刷新页面...
            </p>
          )}
          {status === 'migrating' && (
            <div style={{
              width: '100%',
              height: '4px',
              background: '#e0e0e0',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, #667eea, #764ba2)',
                animation: 'progress 2s ease-in-out infinite'
              }}></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: '#f56565',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        zIndex: 9999,
        maxWidth: '400px'
      }}>
        <h3 style={{ marginBottom: '10px' }}>❌ 迁移失败</h3>
        <p>{progress}</p>
      </div>
    );
  }

  return null;
}

