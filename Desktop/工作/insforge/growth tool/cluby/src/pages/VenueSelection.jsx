import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { client } from '../lib/client';
import { MapPin, Sparkles, LogOut } from 'lucide-react';

export default function VenueSelection() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadVenues();
    loadCurrentVenue();
  }, []);

  const loadVenues = async () => {
    try {
      const { data, error } = await client.database
        .from('venues')
        .select('*')
        .order('name');

      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      console.error('Error loading venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentVenue = async () => {
    try {
      const { data, error } = await client.database
        .from('user_venues')
        .select('*, venues(*)')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setSelectedVenue(data.venue_id);
      }
    } catch (error) {
      // No current venue
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  };

  const handleJoinVenue = async (venueId) => {
    setJoining(true);
    try {
      // Get user's current location
      let location = { latitude: null, longitude: null };
      try {
        location = await getCurrentLocation();
      } catch (error) {
        console.log('Could not get location:', error);
        // Continue without location
      }

      // Remove from current venue
      if (selectedVenue) {
        await client.database
          .from('user_venues')
          .delete()
          .eq('user_id', user.id)
          .eq('venue_id', selectedVenue);
      }

      // Join new venue with location
      const { error } = await client.database
        .from('user_venues')
        .insert([{
          user_id: user.id,
          venue_id: venueId,
          latitude: location.latitude,
          longitude: location.longitude,
        }]);

      if (error) throw error;
      
      setSelectedVenue(venueId);
      navigate('/matching');
    } catch (error) {
      console.error('Error joining venue:', error);
      alert('Failed to join venue');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading venues...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-3xl p-6 mb-4 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-pink-400" />
              <h1 className="text-2xl font-bold text-white">Select Venue</h1>
            </div>
            <button
              onClick={signOut}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
          <p className="text-pink-200">Where are you vibing tonight?</p>
        </div>

        <div className="space-y-3">
          {venues.map((venue) => (
            <button
              key={venue.id}
              onClick={() => handleJoinVenue(venue.id)}
              disabled={joining || selectedVenue === venue.id}
              className={`w-full glass rounded-2xl p-5 text-left transition-all hover:scale-[1.02] ${
                selectedVenue === venue.id
                  ? 'ring-2 ring-pink-500 bg-white/20'
                  : 'hover:bg-white/10'
              } disabled:opacity-50`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-1">
                    {venue.name}
                  </h3>
                  <div className="flex items-center gap-2 text-pink-200 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{venue.address}</span>
                  </div>
                  <span className="inline-block mt-2 px-3 py-1 bg-pink-500/20 text-pink-200 text-xs rounded-full">
                    {venue.category}
                  </span>
                </div>
                {selectedVenue === venue.id && (
                  <div className="ml-4">
                    <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {selectedVenue && (
          <button
            onClick={() => navigate('/matching')}
            className="mt-6 btn-primary w-full"
          >
            Start Matching
          </button>
        )}
      </div>
    </div>
  );
}

