import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../App';
import { client } from '../lib/client';
import { User, MapPin, MessageCircle, ArrowLeft, Users } from 'lucide-react';

// Calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export default function MatchResult() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [matchedUser, setMatchedUser] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    try {
      const { data: matchData, error } = await client.database
        .from('matches')
        .select('*, user1:users!matches_user1_id_fkey(*), user2:users!matches_user2_id_fkey(*)')
        .eq('id', matchId)
        .single();

      if (error) throw error;

      const otherUser = matchData.user1_id === user.id 
        ? matchData.user2 
        : matchData.user1;

      setMatch(matchData);
      setMatchedUser(otherUser);

      // Calculate distance
      const { data: myVenue } = await client.database
        .from('user_venues')
        .select('*, venues(*)')
        .eq('user_id', user.id)
        .single();

      const { data: otherVenue } = await client.database
        .from('user_venues')
        .select('*')
        .eq('user_id', otherUser.id)
        .single();

      if (myVenue && otherVenue && myVenue.latitude && otherVenue.latitude) {
        const dist = calculateDistance(
          myVenue.latitude,
          myVenue.longitude,
          otherVenue.latitude,
          otherVenue.longitude
        );
        setDistance(dist);
      }
    } catch (error) {
      console.error('Error loading match:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    navigate(`/chat/${matchId}`);
  };

  const handleFindAnother = () => {
    navigate('/matching');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!match || !matchedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Match not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-3xl p-6 mb-4 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/matches')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-pink-400" />
              <h1 className="text-xl font-bold text-white">It's a Match!</h1>
            </div>
            <div className="w-9" />
          </div>
        </div>

        <div className="glass rounded-3xl p-8 text-center mb-4">
          <div className="space-y-6">
            <div className="text-6xl">🎉</div>
            
            <div className="flex justify-center gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                {matchedUser.avatar_url ? (
                  <img
                    src={matchedUser.avatar_url}
                    alt={matchedUser.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {matchedUser.nickname || 'Anonymous'}
              </h2>
              {matchedUser.bio && (
                <p className="text-pink-200 text-lg">{matchedUser.bio}</p>
              )}
            </div>

            {distance !== null && (
              <div className="flex items-center justify-center gap-2 text-pink-300">
                <MapPin className="w-5 h-5" />
                <span>
                  {distance < 0.1 
                    ? 'Very close' 
                    : distance < 1 
                      ? `${Math.round(distance * 1000)}m away`
                      : `${distance.toFixed(1)}km away`}
                </span>
              </div>
            )}

            <div className="pt-4">
              <p className="text-pink-200 text-sm">
                You're both at the same venue! Time to meet face-to-face 👋
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleFindAnother}
            className="btn-secondary flex-1"
          >
            Find Another
          </button>
          <button
            onClick={handleStartChat}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Start Chat
          </button>
        </div>
      </div>
    </div>
  );
}

