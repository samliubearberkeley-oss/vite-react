import { createClient } from '@insforge/sdk';

const client = createClient({ 
  baseUrl: 'https://66pusvmy.us-east.insforge.app' 
});

// 真实的旧金山酒吧和俱乐部数据
const sfVenues = [
  {
    name: "Temple Nightclub",
    address: "540 Howard St, San Francisco, CA 94105",
    latitude: 37.7874,
    longitude: -122.3993,
    category: "club"
  },
  {
    name: "The Fillmore",
    address: "1805 Geary Blvd, San Francisco, CA 94115",
    latitude: 37.7844,
    longitude: -122.4333,
    category: "club"
  },
  {
    name: "DNA Lounge",
    address: "375 11th St, San Francisco, CA 94103",
    latitude: 37.7739,
    longitude: -122.4174,
    category: "club"
  },
  {
    name: "The EndUp",
    address: "401 6th St, San Francisco, CA 94103",
    latitude: 37.7794,
    longitude: -122.4097,
    category: "club"
  },
  {
    name: "Monarch",
    address: "101 6th St, San Francisco, CA 94103",
    latitude: 37.7798,
    longitude: -122.4098,
    category: "bar"
  },
  {
    name: "The View Lounge",
    address: "780 Mission St, San Francisco, CA 94103",
    latitude: 37.7854,
    longitude: -122.4048,
    category: "bar"
  },
  {
    name: "Charmaine's",
    address: "1111 Market St, San Francisco, CA 94103",
    latitude: 37.7767,
    longitude: -122.4172,
    category: "bar"
  },
  {
    name: "The Redwood Room",
    address: "495 Geary St, San Francisco, CA 94102",
    latitude: 37.7872,
    longitude: -122.4107,
    category: "bar"
  },
  {
    name: "Tonga Room",
    address: "950 Mason St, San Francisco, CA 94108",
    latitude: 37.7925,
    longitude: -122.4097,
    category: "bar"
  },
  {
    name: "Top of the Mark",
    address: "999 California St, San Francisco, CA 94108",
    latitude: 37.7923,
    longitude: -122.4109,
    category: "bar"
  }
];

// Mock用户数据（吸引人的个人资料）
const mockUsers = [
  {
    email: "sarah.chang@example.com",
    password: "mockpass123",
    nickname: "Sarah",
    bio: "Tech worker by day, music lover by night 🎵",
    avatar_url: "https://i.pravatar.cc/150?img=1",
    gender: "female",
    seeking_gender: "male"
  },
  {
    email: "mike.rodriguez@example.com",
    password: "mockpass123",
    nickname: "Mike",
    bio: "DJ & cocktail enthusiast. Always down for a good vibe 🍸",
    avatar_url: "https://i.pravatar.cc/150?img=12",
    gender: "male",
    seeking_gender: "female"
  },
  {
    email: "emma.wilson@example.com",
    password: "mockpass123",
    nickname: "Emma",
    bio: "Art curator exploring SF's nightlife scene ✨",
    avatar_url: "https://i.pravatar.cc/150?img=9",
    gender: "female",
    seeking_gender: "male"
  },
  {
    email: "james.kim@example.com",
    password: "mockpass123",
    nickname: "James",
    bio: "Foodie and craft beer connoisseur 🍺",
    avatar_url: "https://i.pravatar.cc/150?img=33",
    gender: "male",
    seeking_gender: "female"
  },
  {
    email: "sophia.martinez@example.com",
    password: "mockpass123",
    nickname: "Sophia",
    bio: "Fitness instructor who loves to dance 💃",
    avatar_url: "https://i.pravatar.cc/150?img=20",
    gender: "female",
    seeking_gender: "male"
  },
  {
    email: "alex.taylor@example.com",
    password: "mockpass123",
    nickname: "Alex",
    bio: "Musician and live music junkie 🎸",
    avatar_url: "https://i.pravatar.cc/150?img=14",
    gender: "male",
    seeking_gender: "female"
  },
  {
    email: "maya.patel@example.com",
    password: "mockpass123",
    nickname: "Maya",
    bio: "Startup founder unwinding on weekends 🌙",
    avatar_url: "https://i.pravatar.cc/150?img=47",
    gender: "female",
    seeking_gender: "male"
  },
  {
    email: "david.lee@example.com",
    password: "mockpass123",
    nickname: "David",
    bio: "Photographer capturing SF's nightlife 📸",
    avatar_url: "https://i.pravatar.cc/150?img=45",
    gender: "male",
    seeking_gender: "female"
  },
  {
    email: "olivia.brown@example.com",
    password: "mockpass123",
    nickname: "Olivia",
    bio: "Marketing pro who loves rooftop bars 🏙️",
    avatar_url: "https://i.pravatar.cc/150?img=48",
    gender: "female",
    seeking_gender: "male"
  },
  {
    email: "ryan.chen@example.com",
    password: "mockpass123",
    nickname: "Ryan",
    bio: "Software engineer exploring the city 🚀",
    avatar_url: "https://i.pravatar.cc/150?img=27",
    gender: "male",
    seeking_gender: "female"
  },
  {
    email: "luna.garcia@example.com",
    password: "mockpass123",
    nickname: "Luna",
    bio: "Yoga instructor & wellness advocate 🧘",
    avatar_url: "https://i.pravatar.cc/150?img=32",
    gender: "female",
    seeking_gender: "male"
  },
  {
    email: "noah.johnson@example.com",
    password: "mockpass123",
    nickname: "Noah",
    bio: "Architect and design enthusiast 🏗️",
    avatar_url: "https://i.pravatar.cc/150?img=35",
    gender: "male",
    seeking_gender: "female"
  },
  // 白人金发女性用户
  {
    email: "chloe.anderson@example.com",
    password: "mockpass123",
    nickname: "Chloe",
    bio: "Blonde beauty ready to dance the night away 💫",
    avatar_url: "https://i.pravatar.cc/150?img=5",
    gender: "female",
    seeking_gender: "male"
  },
  {
    email: "taylor.mitchell@example.com",
    password: "mockpass123",
    nickname: "Taylor",
    bio: "Golden hair, golden vibes ✨ Let's make tonight unforgettable",
    avatar_url: "https://i.pravatar.cc/150?img=10",
    gender: "female",
    seeking_gender: "male"
  },
  {
    email: "brittany.scott@example.com",
    password: "mockpass123",
    nickname: "Brittany",
    bio: "Blonde & bold 💋 Looking for someone who can keep up",
    avatar_url: "https://i.pravatar.cc/150?img=15",
    gender: "female",
    seeking_gender: "male"
  },
  {
    email: "madison.clark@example.com",
    password: "mockpass123",
    nickname: "Madison",
    bio: "Sunny blonde, fiery personality 🔥",
    avatar_url: "https://i.pravatar.cc/150?img=22",
    gender: "female",
    seeking_gender: "male"
  },
  {
    email: "hannah.thompson@example.com",
    password: "mockpass123",
    nickname: "Hannah",
    bio: "Blonde bombshell seeking adventure 🌟",
    avatar_url: "https://i.pravatar.cc/150?img=25",
    gender: "female",
    seeking_gender: "male"
  },
  {
    email: "lauren.white@example.com",
    password: "mockpass123",
    nickname: "Lauren",
    bio: "Golden locks, golden hour vibes ✨",
    avatar_url: "https://i.pravatar.cc/150?img=28",
    gender: "female",
    seeking_gender: "male"
  },
  {
    email: "rachel.adams@example.com",
    password: "mockpass123",
    nickname: "Rachel",
    bio: "Blonde beauty with a wild side 💃",
    avatar_url: "https://i.pravatar.cc/150?img=30",
    gender: "female",
    seeking_gender: "male"
  },
  {
    email: "jessica.moore@example.com",
    password: "mockpass123",
    nickname: "Jessica",
    bio: "Sun-kissed blonde ready to paint the town red 🔴",
    avatar_url: "https://i.pravatar.cc/150?img=38",
    gender: "female",
    seeking_gender: "male"
  }
];

async function seedVenues() {
  console.log('Updating venues with real SF locations...');
  
  // 获取现有venues
  const { data: existingVenues } = await client.database
    .from('venues')
    .select('id')
    .order('created_at');
  
  // 更新现有venues
  for (let i = 0; i < Math.min(existingVenues.length, sfVenues.length); i++) {
    const venue = sfVenues[i];
    const { error } = await client.database
      .from('venues')
      .update({
        name: venue.name,
        address: venue.address,
        latitude: venue.latitude,
        longitude: venue.longitude,
        category: venue.category
      })
      .eq('id', existingVenues[i].id);
    
    if (error) {
      console.error(`Error updating venue ${venue.name}:`, error);
    } else {
      console.log(`✓ Updated venue: ${venue.name}`);
    }
  }
  
  // 如果有新venues，添加它们
  if (sfVenues.length > existingVenues.length) {
    const newVenues = sfVenues.slice(existingVenues.length);
    const { error } = await client.database
      .from('venues')
      .insert(newVenues);
    
    if (error) {
      console.error('Error inserting new venues:', error);
    } else {
      console.log(`✓ Added ${newVenues.length} new venues`);
    }
  }
}

async function createMockUsers() {
  console.log('\nCreating mock users...');
  const userIds = [];
  
  for (const userData of mockUsers) {
    try {
      // 注册用户
      const { data: authData, error: signUpError } = await client.auth.signUp({
        email: userData.email,
        password: userData.password
      });
      
      if (signUpError) {
        // 如果用户已存在，尝试登录
        const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
          email: userData.email,
          password: userData.password
        });
        
        if (signInError) {
          console.error(`✗ Error with user ${userData.email}:`, signInError);
          continue;
        }
        
        // 更新profile
        const { error: profileError } = await client.database
          .from('users')
          .update({
            nickname: userData.nickname,
            bio: userData.bio,
            avatar_url: userData.avatar_url,
            gender: userData.gender,
            seeking_gender: userData.seeking_gender
          })
          .eq('id', signInData.user.id);
        
        if (profileError) {
          console.error(`✗ Error updating profile for ${userData.email}:`, profileError);
        } else {
          console.log(`✓ User exists, updated: ${userData.nickname}`);
          userIds.push(signInData.user.id);
        }
      } else {
        // 新用户，更新profile
        const { error: profileError } = await client.database
          .from('users')
          .update({
            nickname: userData.nickname,
            bio: userData.bio,
            avatar_url: userData.avatar_url,
            gender: userData.gender,
            seeking_gender: userData.seeking_gender
          })
          .eq('id', authData.user.id);
        
        if (profileError) {
          console.error(`✗ Error setting profile for ${userData.email}:`, profileError);
        } else {
          console.log(`✓ Created user: ${userData.nickname}`);
          userIds.push(authData.user.id);
        }
      }
    } catch (error) {
      console.error(`✗ Error creating user ${userData.email}:`, error);
    }
  }
  
  return userIds;
}

async function assignUsersToVenues(userIds) {
  console.log('\nAssigning users to venues...');
  
  // 获取所有venues
  const { data: venues } = await client.database
    .from('venues')
    .select('id, latitude, longitude, name')
    .order('name');
  
  if (!venues || venues.length === 0) {
    console.log('No venues found!');
    return;
  }
  
  // 将用户分配到不同的venues
  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    const venueIndex = i % venues.length;
    const venue = venues[venueIndex];
    const venueId = venue.id;
    
    try {
      // 检查是否已存在
      const { data: existing } = await client.database
        .from('user_venues')
        .select('id')
        .eq('user_id', userId)
        .eq('venue_id', venueId)
        .single();
      
      if (!existing) {
        // Generate random location near venue
        const randomLat = venue?.latitude ? venue.latitude + (Math.random() - 0.5) * 0.01 : null;
        const randomLon = venue?.longitude ? venue.longitude + (Math.random() - 0.5) * 0.01 : null;
        
        const { error } = await client.database
          .from('user_venues')
          .insert([{
            user_id: userId,
            venue_id: venueId,
            latitude: randomLat,
            longitude: randomLon
          }]);
        
        if (error) {
          console.error(`✗ Error assigning user to venue:`, error);
        } else {
          console.log(`✓ Assigned user to ${venue?.name || 'venue'}`);
        }
      }
    } catch (error) {
      // 用户可能已经在其他venue，跳过
      console.log(`  User already assigned, skipping...`);
    }
  }
}

async function main() {
  try {
    await seedVenues();
    const userIds = await createMockUsers();
    await assignUsersToVenues(userIds);
    console.log('\n✅ Mock data seeding completed!');
  } catch (error) {
    console.error('Error seeding mock data:', error);
  }
}

main();

