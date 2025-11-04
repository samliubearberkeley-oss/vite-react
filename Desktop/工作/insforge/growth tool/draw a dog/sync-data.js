// 改进的数据同步脚本 - 使用与 DataSync.jsx 相同的逻辑
// 使用方法：
// 1. 在浏览器中打开应用页面
// 2. 打开浏览器控制台 (F12)
// 3. 确保已经配置了 VITE_INSFORGE_BASE_URL（或者直接修改下面的 baseUrl）
// 4. 复制粘贴此脚本并回车执行

(async function syncDataToInsforge() {
  console.log('🚀 开始同步数据到 Insforge...');
  
  // 从环境变量获取 baseUrl，或者手动设置
  // 如果需要，可以在这里直接设置：const baseUrl = 'https://your-instance.insforge.app';
  const baseUrl = window.__VITE_INSFORGE_BASE_URL__ || 
                  localStorage.getItem('insforge_base_url') ||
                  'https://pqh4hzpa.us-east.insforge.app'; // 默认值，请根据实际情况修改
  
  console.log(`📡 使用 Insforge 后端: ${baseUrl}`);
  
  // 动态导入 Insforge SDK
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@insforge/sdk@latest/+esm');
  const client = createClient({ baseUrl });

  // 辅助函数：将 base64 data URL 转换为 Blob
  async function dataURLtoBlob(dataURL) {
    if (dataURL && dataURL.startsWith('data:')) {
      const response = await fetch(dataURL);
      return await response.blob();
    }
    return null;
  }

  // 从 mock_storage_dog-images 中查找图片
  function findImageInStorage(dog, images) {
    if (!images || Object.keys(images).length === 0) {
      return null;
    }

    // 尝试多种匹配方式
    // 1. 如果 image_url 是文件名，直接查找
    if (dog.image_url && !dog.image_url.startsWith('data:') && !dog.image_url.startsWith('http')) {
      if (images[dog.image_url]) {
        return images[dog.image_url];
      }
    }

    // 2. 尝试根据 dog.id 或 user_id 匹配文件名
    const possibleKeys = Object.keys(images);
    for (const key of possibleKeys) {
      if (key.includes(dog.id) || key.includes(dog.user_id)) {
        return images[key];
      }
    }

    // 3. 如果只有一个图片，直接使用
    if (possibleKeys.length === 1) {
      return images[possibleKeys[0]];
    }

    return null;
  }

  // 检查是否已存在相同的记录（避免重复上传）
  async function checkDuplicate(dog, client) {
    try {
      const { data, error } = await client.database
        .from('dogs')
        .select('id')
        .eq('user_id', dog.user_id)
        .eq('score', dog.score)
        .gte('created_at', new Date(new Date(dog.created_at).getTime() - 1000).toISOString())
        .lte('created_at', new Date(new Date(dog.created_at).getTime() + 1000).toISOString())
        .limit(1);

      if (error) {
        console.warn('检查重复记录时出错:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (err) {
      console.warn('检查重复记录时出错:', err);
      return false;
    }
  }

  try {
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // 步骤 1: 同步用户
    console.log('\n📋 步骤 1: 同步用户...');
    const usersData = localStorage.getItem('mock_db_app_users');
    if (usersData) {
      const users = JSON.parse(usersData);
      console.log(`找到 ${users.length} 个用户`);
      
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        console.log(`  处理用户 ${i + 1}/${users.length} (${user.id.substring(0, 8)}...)`);
        try {
          const { error } = await client.database
            .from('app_users')
            .insert([{
              id: user.id,
              created_at: user.created_at,
              last_seen: user.last_seen || user.created_at
            }]);

          if (error) {
            if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
              console.log(`  ⏭️ 用户已存在，跳过: ${user.id.substring(0, 8)}...`);
              skippedCount++;
            } else {
              console.error(`  ❌ 迁移用户失败:`, error);
              errorCount++;
            }
          } else {
            console.log(`  ✅ 迁移用户成功: ${user.id.substring(0, 8)}...`);
            successCount++;
          }
        } catch (err) {
          console.error(`  ❌ 迁移用户失败:`, err.message);
          errorCount++;
        }
      }
    } else {
      console.log('  ⚠️ 没有找到用户数据');
    }

    // 步骤 2: 同步狗和图片
    console.log('\n📋 步骤 2: 同步狗和图片...');
    const dogsData = localStorage.getItem('mock_db_dogs');
    const storageData = localStorage.getItem('mock_storage_dog-images');
    const images = storageData ? JSON.parse(storageData) : {};
    
    if (!dogsData) {
      console.log('  ⚠️ 没有找到狗的数据');
      console.log('\n✅ 同步完成！（没有数据需要同步）');
      return;
    }

    const dogs = JSON.parse(dogsData);
    console.log(`找到 ${dogs.length} 只狗，${Object.keys(images).length} 张图片`);

    for (let i = 0; i < dogs.length; i++) {
      const dog = dogs[i];
      console.log(`\n  [${i + 1}/${dogs.length}] 处理狗 ${dog.id?.substring(0, 8) || 'unknown'}...`);

      try {
        // 检查是否已存在（避免重复上传）
        const isDuplicate = await checkDuplicate(dog, client);
        if (isDuplicate) {
          console.log(`  ⏭️ 狗已存在，跳过: ${dog.id}`);
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
            console.warn('  ⚠️ 无法从 URL 获取图片，尝试从 storage 查找:', err.message);
          }
        }
        
        // 方式 3: 从 mock_storage_dog-images 中查找
        if (!imageBlob) {
          const storageImage = findImageInStorage(dog, images);
          if (storageImage) {
            imageDataURL = storageImage;
            imageBlob = await dataURLtoBlob(storageImage);
            console.log('  ✅ 从 storage 中找到图片');
          }
        }

        // 如果仍然没有找到图片
        if (!imageBlob) {
          console.warn('  ⚠️ 无法找到狗的图片，尝试直接保存元数据');
          if (dog.image_url) {
            const { error: dbError } = await client.database
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
                console.log('  ⏭️ 狗已存在（数据库约束），跳过');
                skippedCount++;
              } else {
                console.error('  ❌ 数据库插入失败:', dbError.message);
                errorCount++;
              }
            } else {
              console.log('  ✅ 保存元数据成功');
              successCount++;
            }
          } else {
            console.warn('  ❌ 狗没有图片 URL，跳过');
            errorCount++;
          }
          continue;
        }

        // 上传图片到 Insforge Storage
        const timestamp = Date.now();
        const filename = `migrated_${dog.user_id}_${timestamp}_${i}.png`;
        console.log(`  ⬆️ 上传图片: ${filename}`);
        
        const { data: uploadData, error: uploadError } = await client.storage
          .from('dog-images')
          .upload(filename, imageBlob);

        if (uploadError) {
          console.error(`  ❌ 图片上传失败:`, uploadError.message);
          errorCount++;
          continue;
        }

        // 获取上传后的 URL
        const imageUrl = uploadData?.url || uploadData?.data?.url || uploadData;
        if (!imageUrl) {
          console.error('  ❌ 上传后未返回图片 URL');
          errorCount++;
          continue;
        }

        console.log(`  ✅ 图片已上传`);

        // 保存到数据库
        console.log(`  💾 保存到数据库...`);
        const { error: dbError } = await client.database
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
            console.log('  ⏭️ 狗已存在（数据库约束），跳过');
            skippedCount++;
          } else {
            console.error('  ❌ 数据库插入失败:', dbError.message);
            errorCount++;
          }
        } else {
          console.log(`  ✅ 狗迁移成功!`);
          successCount++;
        }
      } catch (err) {
        console.error(`  ❌ 迁移失败:`, err.message);
        errorCount++;
      }
    }

    // 同步完成
    console.log('\n\n🎉 同步完成!');
    console.log(`✅ 成功: ${successCount}`);
    console.log(`⏭️ 跳过: ${skippedCount}`);
    console.log(`❌ 失败: ${errorCount}`);

    if (successCount > 0 || skippedCount > 0) {
      console.log('\n💡 提示：如果同步成功，可以清除 localStorage:');
      console.log('localStorage.removeItem("mock_db_dogs");');
      console.log('localStorage.removeItem("mock_db_app_users");');
      console.log('localStorage.removeItem("mock_storage_dog-images");');
      console.log('localStorage.setItem("insforge_migrated", "true");');
      console.log('\n然后刷新页面查看同步的数据！');
    }

  } catch (err) {
    console.error('\n❌ 同步失败:', err);
    console.error('错误详情:', err);
  }
})();

