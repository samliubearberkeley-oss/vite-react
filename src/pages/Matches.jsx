import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { client } from '../lib/client';
import { MessageCircle, Sparkles, ArrowLeft } from 'lucide-react';

export default function Matches() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const { data, error } = await client.database
        .from('matches')
        .select('*, user1:users!matches_user1_id_fkey(*), user2:users!matches_user2_id_fkey(*)')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('matched_at', { ascending: false });

      if (error) throw error;

      // Get last message for each match
      const matchesWithMessages = await Promise.all(
        (data || []).map(async (match) => {
          const { data: lastMessage } = await client.database
            .from('messages')
            .select('*')
            .eq('match_id', match.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return { ...match, lastMessage };
        })
      );

      setMatches(matchesWithMessages);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
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
              onClick={() => navigate('/users')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-pink-400" />
              <h1 className="text-xl font-bold text-white">Matches</h1>
            </div>
            <div className="w-9" />
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <MessageCircle className="w-16 h-16 text-pink-400 mx-auto mb-4 opacity-50" />
            <p className="text-pink-200">No matches yet</p>
            <p className="text-pink-300 text-sm mt-2">Start matching with people at your venue!</p>
            <button
              onClick={() => navigate('/users')}
              className="mt-4 btn-primary"
            >
              Find Matches
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => {
              const otherUser = match.user1_id === user.id ? match.user2 : match.user1;
              return (
                <button
                  key={match.id}
                  onClick={() => navigate(`/chat/${match.id}`)}
                  className="w-full glass rounded-2xl p-5 text-left hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      {otherUser?.avatar_url ? (
                        <img
                          src={otherUser.avatar_url}
                          alt={otherUser.nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                          {otherUser?.nickname?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-lg truncate">
                        {otherUser?.nickname || 'Anonymous'}
                      </h3>
                      {match.lastMessage ? (
                        <p className="text-pink-200 text-sm truncate mt-1">
                          {match.lastMessage.content}
                        </p>
                      ) : match.icebreaker ? (
                        <p className="text-pink-300 text-sm truncate mt-1 italic">
                          {match.icebreaker}
                        </p>
                      ) : (
                        <p className="text-pink-200 text-sm mt-1">New match!</p>
                      )}
                    </div>
                    <MessageCircle className="w-5 h-5 text-pink-400 flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

