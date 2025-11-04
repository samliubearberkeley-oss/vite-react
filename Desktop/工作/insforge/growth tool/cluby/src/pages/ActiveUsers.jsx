import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { client } from '../lib/client';
import { User, Heart, Sparkles, ArrowLeft, MessageCircle } from 'lucide-react';

export default function ActiveUsers() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeUsers, setActiveUsers] = useState([]);
  const [currentVenue, setCurrentVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(null);

  useEffect(() => {
    loadActiveUsers();
    const interval = setInterval(loadActiveUsers, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const loadActiveUsers = async () => {
    try {
      // Get current venue
      const { data: venueData } = await client.database
        .from('user_venues')
        .select('*, venues(*)')
        .eq('user_id', user.id)
        .single();

      if (!venueData) {
        navigate('/venues');
        return;
      }

      setCurrentVenue(venueData.venues);

      // Get all users in this venue
      const { data: usersData, error } = await client.database
        .from('user_venues')
        .select('*, users(*)')
        .eq('venue_id', venueData.venue_id)
        .neq('user_id', user.id);

      if (error) throw error;

      // Get existing matches
      const { data: matchesData } = await client.database
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      const matchedUserIds = new Set();
      matchesData?.forEach((match) => {
        if (match.user1_id === user.id) matchedUserIds.add(match.user2_id);
        else matchedUserIds.add(match.user1_id);
      });

      // Filter out matched users
      const filteredUsers = usersData?.filter(
        (uv) => !matchedUserIds.has(uv.users.id)
      ) || [];

      setActiveUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async (targetUserId) => {
    setMatching(targetUserId);
    try {
      // Determine user1 and user2 (ensuring user1 < user2)
      const [user1Id, user2Id] = user.id < targetUserId 
        ? [user.id, targetUserId]
        : [targetUserId, user.id];

      // Generate AI icebreaker
      let icebreaker = '';
      try {
        const { data: user1Profile } = await client.auth.getProfile(user1Id);
        const { data: user2Profile } = await client.auth.getProfile(user2Id);
        
        const completion = await client.ai.chat.completions.create({
          model: 'openai/gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a creative icebreaker generator for a social matching app. Generate fun, flirty, and engaging conversation starters.'
            },
            {
              role: 'user',
              content: `Generate a fun icebreaker for ${user1Profile?.nickname || 'someone'} to start a conversation with ${user2Profile?.nickname || 'someone'} at a club/bar. Make it casual, playful, and easy to respond to.`
            }
          ],
          temperature: 0.9,
          maxTokens: 100,
        });

        icebreaker = completion.choices[0].message.content.trim();
      } catch (aiError) {
        console.error('AI error:', aiError);
        icebreaker = "Hey! I saw you here and thought I'd say hi 👋";
      }

      // Create match
      const { data, error } = await client.database
        .from('matches')
        .insert([{
          user1_id: user1Id,
          user2_id: user2Id,
          icebreaker,
        }])
        .select()
        .single();

      if (error) throw error;

      // Navigate to chat
      navigate(`/chat/${data.id}`);
    } catch (error) {
      console.error('Match error:', error);
      alert('Failed to match');
    } finally {
      setMatching(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-3xl p-6 mb-4 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/venues')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-pink-400" />
              <h1 className="text-xl font-bold text-white">Active Users</h1>
            </div>
            <button
              onClick={() => navigate('/matches')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </button>
          </div>
          {currentVenue && (
            <p className="text-pink-200 text-sm">
              {currentVenue.name} • {activeUsers.length} active
            </p>
          )}
        </div>

        {activeUsers.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-pink-200">No other users at this venue yet</p>
            <p className="text-pink-300 text-sm mt-2">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeUsers.map((uv) => {
              const userProfile = uv.users;
              return (
                <div
                  key={uv.id}
                  className="glass rounded-2xl p-5 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      {userProfile.avatar_url ? (
                        <img
                          src={userProfile.avatar_url}
                          alt={userProfile.nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-lg truncate">
                        {userProfile.nickname || 'Anonymous'}
                      </h3>
                      {userProfile.bio && (
                        <p className="text-pink-200 text-sm truncate mt-1">
                          {userProfile.bio}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleMatch(userProfile.id)}
                      disabled={matching === userProfile.id}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                      <Heart className="w-5 h-5" />
                      {matching === userProfile.id ? 'Matching...' : 'Match'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

