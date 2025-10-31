import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { client } from '../lib/client';
import { Sparkles, Users, MapPin, ArrowLeft } from 'lucide-react';

// Calculate distance between two points using Haversine formula
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

export default function Matching() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [currentVenue, setCurrentVenue] = useState(null);
  const [poolCount, setPoolCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [matchFound, setMatchFound] = useState(null);
  const [waitTime, setWaitTime] = useState(0);
  const waitTimerRef = useRef(null);
  const matchFoundRef = useRef(false);
  const matchingRef = useRef(false);

  useEffect(() => {
    matchFoundRef.current = matchFound !== null;
    matchingRef.current = matching;
  }, [matchFound, matching]);

  useEffect(() => {
    if (!user?.id) return;
    
    loadPoolAndMatch();
    const interval = setInterval(loadPoolAndMatch, 3000); // Check every 3 seconds
    
    // Start wait timer - match after 5-8 seconds regardless
    const waitSeconds = 5 + Math.random() * 3; // 5-8 seconds
    let elapsed = 0;
    
    waitTimerRef.current = setInterval(() => {
      elapsed += 0.1;
      setWaitTime(Math.min(elapsed, waitSeconds));
      
      if (elapsed >= waitSeconds && !matchFoundRef.current && !matchingRef.current) {
        // Force match even if no one in pool
        forceMatchAfterWait();
      }
    }, 100);
    
    return () => {
      clearInterval(interval);
      if (waitTimerRef.current) clearInterval(waitTimerRef.current);
    };
  }, [user?.id]);

  const loadPoolAndMatch = async () => {
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

      // Get user's profile to check gender preferences
      let userProfile = profile;
      if (!userProfile || !userProfile.gender || !userProfile.seeking_gender) {
        const { data: profileData } = await client.auth.getProfile(user.id);
        userProfile = profileData;
      }
      
      if (!userProfile || !userProfile.gender || !userProfile.seeking_gender) {
        navigate('/profile-setup');
        return;
      }

      // Get all users in this venue matching preferences
      const { data: usersData, error } = await client.database
        .from('user_venues')
        .select('*, users(*)')
        .eq('venue_id', venueData.venue_id)
        .neq('user_id', user.id);

      if (error) throw error;

      // Filter by gender preferences
      const eligibleUsers = usersData?.filter((uv) => {
        const otherUser = uv.users;
        if (!otherUser.gender || !otherUser.seeking_gender) return false;
        
        // Check if other user is seeking my gender or all
        const otherUserWantsMe = 
          otherUser.seeking_gender === 'all' || 
          otherUser.seeking_gender === userProfile.gender;
        
        // Check if I'm seeking their gender or all
        const iWantThem = 
          userProfile.seeking_gender === 'all' || 
          userProfile.seeking_gender === otherUser.gender;
        
        return otherUserWantsMe && iWantThem;
      }) || [];

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

      // Filter out already matched users
      const availableUsers = eligibleUsers.filter(
        (uv) => !matchedUserIds.has(uv.users.id)
      );

      setPoolCount(availableUsers.length);

      // Auto-match if available users exist
      if (availableUsers.length > 0 && !matchFoundRef.current && !matchingRef.current) {
        tryAutoMatch(availableUsers, venueData);
      }
    } catch (error) {
      console.error('Error loading pool:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceMatchAfterWait = async () => {
    if (matchFoundRef.current || matchingRef.current) return;
    
    setMatching(true);
    matchingRef.current = true;
    
    try {
      // Get current venue
      const { data: venueData } = await client.database
        .from('user_venues')
        .select('*, venues(*)')
        .eq('user_id', user.id)
        .single();

      if (!venueData) return;

      // Get user's profile
      let userProfile = profile;
      if (!userProfile || !userProfile.gender || !userProfile.seeking_gender) {
        const { data: profileData } = await client.auth.getProfile(user.id);
        userProfile = profileData;
      }

      // Get all users in venue (any gender for demo)
      const { data: usersData } = await client.database
        .from('user_venues')
        .select('*, users(*)')
        .eq('venue_id', venueData.venue_id)
        .neq('user_id', user.id);

      const availableUsers = usersData?.filter((uv) => {
        const otherUser = uv.users;
        if (!otherUser.gender || !otherUser.seeking_gender) return false;
        return true; // Match with anyone for demo
      }) || [];

      if (availableUsers.length > 0) {
        // Match with first available user
        const matchTarget = availableUsers[0];
        const targetUserId = matchTarget.users.id;

        const [user1Id, user2Id] = user.id < targetUserId 
          ? [user.id, targetUserId]
          : [targetUserId, user.id];

        const { data, error } = await client.database
          .from('matches')
          .insert([{
            user1_id: user1Id,
            user2_id: user2Id,
          }])
          .select()
          .single();

        if (!error && data) {
          setMatchFound({
            matchId: data.id,
            matchedUser: matchTarget.users,
            distance: null,
          });
          matchFoundRef.current = true;
          
          setTimeout(() => {
            navigate(`/match-result/${data.id}`);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Force match error:', error);
    } finally {
      setMatching(false);
      matchingRef.current = false;
    }
  };

  const tryAutoMatch = async (availableUsers, venueData) => {
    if (matchFoundRef.current || matchingRef.current) return;
    
    setMatching(true);
    matchingRef.current = true;
    
    try {
      // Get current user's location
      const currentUserVenue = venueData;
      const currentUserLat = currentUserVenue.latitude;
      const currentUserLon = currentUserVenue.longitude;

      // Calculate distances and sort by closest
      const usersWithDistance = availableUsers.map((uv) => {
        const distance = calculateDistance(
          currentUserLat,
          currentUserLon,
          uv.latitude,
          uv.longitude
        );
        return { ...uv, distance };
      }).sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });

      // Match with closest user
      const matchTarget = usersWithDistance[0];
      const targetUserId = matchTarget.users.id;

      // Determine user1 and user2 (ensuring user1 < user2)
      const [user1Id, user2Id] = user.id < targetUserId 
        ? [user.id, targetUserId]
        : [targetUserId, user.id];

      // Create match
      const { data, error } = await client.database
        .from('matches')
        .insert([{
          user1_id: user1Id,
          user2_id: user2Id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Navigate to match result
      setMatchFound({
        matchId: data.id,
        matchedUser: matchTarget.users,
        distance: matchTarget.distance,
      });
      matchFoundRef.current = true;
      
      setTimeout(() => {
        navigate(`/match-result/${data.id}`);
      }, 2000);
    } catch (error) {
      console.error('Auto-match error:', error);
    } finally {
      setMatching(false);
      matchingRef.current = false;
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
              <h1 className="text-xl font-bold text-white">Matching</h1>
            </div>
            <div className="w-9" />
          </div>
          {currentVenue && (
            <p className="text-pink-200 text-sm">
              {currentVenue.name}
            </p>
          )}
        </div>

        <div className="glass rounded-3xl p-8 text-center">
          {matchFound ? (
            <div className="space-y-6">
              <div className="text-4xl">🎉</div>
              <h2 className="text-2xl font-bold text-white">Match Found!</h2>
              <p className="text-pink-200">Preparing your match...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                    <Users className="w-16 h-16 text-white opacity-50" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/30 blur-xl"></div>
                </div>
              </div>
              
              <div>
                <div className="text-6xl font-bold text-white mb-2">
                  {poolCount > 0 ? poolCount : '?'}
                </div>
                <p className="text-pink-200 text-lg">
                  {poolCount > 0 
                    ? 'people in the pool' 
                    : 'Waiting for more people...'}
                </p>
              </div>

              <div className="pt-4">
                <div className="flex items-center justify-center gap-2 text-pink-300">
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">
                    {matching ? 'Finding your match...' : 'Waiting for system matching...'}
                  </span>
                </div>
                {waitTime > 0 && waitTime < 8 && (
                  <div className="mt-2 text-xs text-pink-400">
                    {Math.round(waitTime)}s
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

