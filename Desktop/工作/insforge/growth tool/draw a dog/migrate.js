// 直接在浏览器控制台运行此脚本进行数据迁移
// 1. 打开主应用页面 (http://localhost:5173)
// 2. 打开浏览器控制台 (F12)
// 3. 复制粘贴此脚本并回车

(async function migrateData() {
  console.log('🚀 开始迁移数据到 Insforge...');
  
  // 动态导入 Insforge SDK
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@insforge/sdk@latest/+esm');
  const client = createClient({ baseUrl: 'https://pqh4hzpa.us-east.insforge.app' });

  // 辅助函数：将 base64 转换为 Blob
  async function dataURLtoBlob(dataURL) {
    const res = await fetch(dataURL);
    return await res.blob();
  }

  try {
    // 步骤 1: 迁移用户
    console.log('\n📋 步骤 1: 迁移用户...');
    const usersData = localStorage.getItem('mock_db_app_users');
    if (usersData) {
      const users = JSON.parse(usersData);
      console.log(`找到 ${users.length} 个用户`);
      
      for (const user of users) {
        try {
          const { error } = await client.database
            .from('app_users')
            .insert([{
              id: user.id,
              created_at: user.created_at,
              last_seen: user.last_seen || user.created_at
            }]);
          
          if (error && !error.message.includes('duplicate')) {
            console.warn(`  ⚠️ 用户 ${user.id.substring(0, 8)} 可能已存在`);
          } else if (!error) {
            console.log(`  ✅ 迁移用户: ${user.id.substring(0, 8)}...`);
          }
        } catch (err) {
          console.error(`  ❌ 迁移用户失败:`, err.message);
        }
      }
    } else {
      console.log('  ⚠️ 没有找到用户数据');
    }

    // 步骤 2: 迁移狗（包括图片）
    console.log('\n📋 步骤 2: 迁移狗和图片...');
    const dogsData = localStorage.getItem('mock_db_dogs');
    
    if (!dogsData) {
      console.log('  ⚠️ 没有找到狗的数据');
      console.log('\n✅ 迁移完成！（没有数据需要迁移）');
      return;
    }

    const dogs = JSON.parse(dogsData);
    console.log(`找到 ${dogs.length} 只狗`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < dogs.length; i++) {
      const dog = dogs[i];
      console.log(`\n  [${i + 1}/${dogs.length}] 处理狗 ${dog.id || 'unknown'}...`);

      try {
        // 转换图片
        console.log(`    📦 转换图片...`);
        const imageBlob = await dataURLtoBlob(dog.image_url);
        
        // 上传到 Storage
        const filename = `migrated_${dog.user_id}_${Date.now()}_${i}.png`;
        console.log(`    ⬆️ 上传图片: ${filename}`);
        const { data: uploadData, error: uploadError } = await client.storage
          .from('dog-images')
          .upload(filename, imageBlob);

        if (uploadError) {
          console.error(`    ❌ 图片上传失败:`, uploadError.message);
          errorCount++;
          continue;
        }

        const imageUrl = uploadData.url;
        console.log(`    ✅ 图片已上传`);

        // 插入数据库
        console.log(`    💾 保存到数据库...`);
        const { data: dbData, error: dbError } = await client.database
          .from('dogs')
          .insert([{
            user_id: dog.user_id,
            image_url: imageUrl,
            score: dog.score,
            likes: dog.likes || 0,
            dislikes: dog.dislikes || 0,
            created_at: dog.created_at
          }])
          .select()
          .single();

        if (dbError) {
          console.error(`    ❌ 数据库插入失败:`, dbError.message);
          errorCount++;
          continue;
        }

        console.log(`    ✅ 狗迁移成功! 新 ID: ${dbData.id}`);
        successCount++;

      } catch (err) {
        console.error(`    ❌ 错误:`, err.message);
        errorCount++;
      }
    }

    // 迁移完成
    console.log('\n\n🎉 迁移完成!');
    console.log(`✅ 成功迁移: ${successCount} 只狗`);
    if (errorCount > 0) {
      console.log(`⚠️ 失败: ${errorCount} 只狗`);
    }

    console.log('\n💡 现在可以清除 localStorage:');
    console.log('localStorage.removeItem("mock_db_dogs");');
    console.log('localStorage.removeItem("mock_db_app_users");');
    console.log('localStorage.removeItem("mock_storage_dog-images");');
    console.log('\n然后刷新页面查看迁移的数据！');

  } catch (err) {
    console.error('\n❌ 迁移失败:', err);
  }
})();

