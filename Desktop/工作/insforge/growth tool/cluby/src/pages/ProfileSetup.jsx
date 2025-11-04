import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { client } from '../lib/client';
import { User, Camera, Sparkles } from 'lucide-react';

export default function ProfileSetup() {
  const { user, profile, checkUser } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [gender, setGender] = useState('');
  const [seekingGender, setSeekingGender] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile?.nickname) {
      setNickname(profile.nickname);
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
      setGender(profile.gender || '');
      setSeekingGender(profile.seeking_gender || '');
    }
  }, [profile]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await client.storage
        .from('avatars')
        .upload(fileName, file);

      if (error) throw error;
      setAvatarUrl(data.url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      alert('Please enter a nickname');
      return;
    }
    if (!gender) {
      alert('Please select your gender');
      return;
    }
    if (!seekingGender) {
      alert('Please select who you are seeking');
      return;
    }

    setSaving(true);
    try {
      const { error } = await client.database
        .from('users')
        .update({
          nickname,
          bio,
          avatar_url: avatarUrl,
          gender,
          seeking_gender: seekingGender,
        })
        .eq('id', user.id);

      if (error) throw error;
      await checkUser();
      navigate('/venues');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const skipSetup = () => {
    navigate('/venues');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-10 h-10 text-pink-400" />
            <h1 className="text-3xl font-bold text-white">Setup Profile</h1>
          </div>
          <p className="text-pink-200">Tell us about yourself</p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-white" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-pink-500 rounded-full p-2 hover:bg-pink-600 transition-colors"
                disabled={uploading}
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-pink-200 text-sm mb-2">Nickname *</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your nickname"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>

          <div>
            <label className="block text-pink-200 text-sm mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-pink-200 text-sm mb-2">I am *</label>
            <div className="grid grid-cols-3 gap-2">
              {['male', 'female', 'other'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`px-4 py-3 rounded-lg transition-all ${
                    gender === g
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/10 text-pink-200 hover:bg-white/20'
                  }`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-pink-200 text-sm mb-2">Seeking *</label>
            <div className="grid grid-cols-2 gap-2">
              {['male', 'female', 'other', 'all'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSeekingGender(g)}
                  className={`px-4 py-3 rounded-lg transition-all ${
                    seekingGender === g
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/10 text-pink-200 hover:bg-white/20'
                  }`}
                >
                  {g === 'all' ? 'All' : g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={skipSetup}
              className="btn-secondary flex-1"
            >
              Skip
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

