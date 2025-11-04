import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { client } from '../lib/client';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';

export default function Chat() {
  const { matchId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const messagesEndRef = useRef(null);
  const aiReplyRef = useRef(false);

  useEffect(() => {
    loadMatch();
    loadMessages();
    const interval = setInterval(loadMessages, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMatch = async () => {
    try {
      const { data, error } = await client.database
        .from('matches')
        .select('*, user1:users!matches_user1_id_fkey(*), user2:users!matches_user2_id_fkey(*)')
        .eq('id', matchId)
        .single();

      if (error) throw error;
      setMatch(data);
    } catch (error) {
      console.error('Error loading match:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await client.database
        .from('messages')
        .select('*, sender:users(*)')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading messages:', error);
      setLoading(false);
    }
  };

  const generateAIReply = async (conversationHistory, otherUserGender, otherUserNickname, otherUserId) => {
    if (aiReplyRef.current || generatingAI) return;
    
    setGeneratingAI(true);
    aiReplyRef.current = true;
    
    try {
      // Build conversation history for context
      const chatMessages = conversationHistory.map(msg => ({
        role: msg.sender_id === user.id ? 'user' : 'assistant',
        content: msg.content
      }));

      // Different system prompts based on gender
      let systemPrompt = '';
      if (otherUserGender === 'male') {
        systemPrompt = `You are ${otherUserNickname}, an alpha male at a club/bar. You're here for hookup and fun - keep it casual, confident, and direct. Your goal is to meet up (wya - where you at). Be flirty, playful, and show interest. Keep responses short and engaging (1-2 sentences max). Use casual language, emojis occasionally. Ask questions like "wya" (where you at), suggest meeting up, be forward but not creepy. This is for fun only.`;
      } else {
        systemPrompt = `You are ${otherUserNickname}, a fun and flirty person at a club/bar. You're here for hookup and fun - keep it light, playful, and engaging. Your goal is to meet up (wya - where you at). Be flirty, show interest, keep it casual. Keep responses short and fun (1-2 sentences max). Use casual language, emojis occasionally. Ask questions like "wya" (where you at), suggest meeting up, be playful but not too forward. This is for fun only.`;
      }

      const completion = await client.ai.chat.completions.create({
        model: 'openai/gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...chatMessages.slice(-10), // Last 10 messages for context
        ],
        temperature: 0.9,
        maxTokens: 100,
      });

      const aiReply = completion.choices[0].message.content.trim();
      
      // Save AI reply as message from other user
      const { error } = await client.database
        .from('messages')
        .insert([{
          match_id: matchId,
          sender_id: otherUserId,
          content: aiReply,
        }]);

      if (error) throw error;
      
      // Reload messages
      await loadMessages();
    } catch (error) {
      console.error('AI reply error:', error);
    } finally {
      setGeneratingAI(false);
      aiReplyRef.current = false;
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || generatingAI) return;

    setSending(true);
    try {
      const { error } = await client.database
        .from('messages')
        .insert([{
          match_id: matchId,
          sender_id: user.id,
          content: newMessage.trim(),
        }]);

      if (error) throw error;
      setNewMessage('');
      await loadMessages();
      
      // Reset AI reply flag for new message
      aiReplyRef.current = false;
      
      // Generate AI reply after a short delay
      setTimeout(async () => {
        // Reload messages to get latest
        const { data: latestMessages } = await client.database
          .from('messages')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true });
        
        if (match && latestMessages && latestMessages.length > 0) {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          const otherUser = match.user1_id === user.id ? match.user2 : match.user1;
          
          // Only generate if last message is from user and we haven't generated yet
          const lastMessage = latestMessages[latestMessages.length - 1];
          if (lastMessage.sender_id === user.id && !aiReplyRef.current) {
            await generateAIReply(latestMessages, otherUser?.gender || 'female', otherUser?.nickname || 'Someone', otherUserId);
          }
        }
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Match not found</div>
      </div>
    );
  }

  const otherUser = match.user1_id === user.id ? match.user2 : match.user1;
  const isOtherUser = (senderId) => senderId !== user.id;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-900 via-pink-900 to-red-900">
      <div className="glass-strong border-b border-white/20 p-4">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/users')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-pink-500 to-purple-600">
              {otherUser?.avatar_url ? (
                <img src={otherUser.avatar_url} alt={otherUser.nickname} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-sm">
                  {otherUser?.nickname?.[0] || '?'}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-white font-semibold">{otherUser?.nickname || 'Anonymous'}</h2>
              <p className="text-pink-200 text-xs">Online</p>
            </div>
          </div>
        </div>
      </div>

      {match.icebreaker && messages.length === 0 && (
        <div className="max-w-4xl mx-auto w-full px-4 py-6">
          <div className="glass rounded-2xl p-4 border-l-4 border-pink-500">
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-pink-200 text-sm font-semibold mb-1">AI Icebreaker</p>
                <p className="text-white">{match.icebreaker}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isOtherUser(message.sender_id) ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl p-4 ${
                  isOtherUser(message.sender_id)
                    ? 'glass-strong text-white'
                    : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                }`}
              >
                <p className="text-sm break-words">{message.content}</p>
                <p className={`text-xs mt-1 ${isOtherUser(message.sender_id) ? 'text-pink-200' : 'text-white/70'}`}>
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={sendMessage} className="glass-strong border-t border-white/20 p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={generatingAI ? "AI is typing..." : "Type a message..."}
            className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white placeholder-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
            disabled={generatingAI}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim() || generatingAI}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingAI ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

