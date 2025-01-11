'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Chat {
  id: number;
  title: string;
  type: 'channel' | 'group' | 'bot' | 'contact';
  isCreator?: boolean;
  username?: string;
}

interface Message {
  id: number;
  date: number;
  message: string;
  fromId?: string;
  views?: number;
  forwards?: number;
  replyTo?: {
    replyToMsgId: number;
    replyToTopId?: number;
  } | null;
  media?: {
    type: string;
  } | null;
}

type ChatType = 'all' | 'channel' | 'group' | 'bot' | 'contact';

export default function Home() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [step, setStep] = useState<'phone' | 'code' | 'authenticated'>('phone');
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [channelTitle, setChannelTitle] = useState('');
  const [channelAbout, setChannelAbout] = useState('');
  const [activeFilter, setActiveFilter] = useState<ChatType>('all');
  const [session, setSession] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('telegramSession') || '';
    }
    return '';
  });
  const [messageInput, setMessageInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (session) {
      setStep('authenticated');
      fetchChats();
    }
  }, []);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Format phone number: ensure it starts with country code
    let formattedPhone = phoneNumber.replace(/[^\d+]/g, '');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }
    
    try {
      const response = await fetch('/api/telegram/mtproto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendCode',
          phone: formattedPhone,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setPhoneCodeHash(data.phone_code_hash);
        setStep('code');
      } else {
        setError(data.error || 'Failed to send verification code');
      }
    } catch (err) {
      setError('Failed to connect to Telegram');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Format phone number: ensure it starts with country code
    let formattedPhone = phoneNumber.replace(/[^\d+]/g, '');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }
    
    try {
      const response = await fetch('/api/telegram/mtproto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signIn',
          phone: formattedPhone,
          code: verificationCode.trim(),
          phone_code_hash: phoneCodeHash,
          session,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setSession(data.session);
        localStorage.setItem('telegramSession', data.session);
        setStep('authenticated');
        fetchChats();
      } else if (data.error === 'PASSWORD_REQUIRED') {
        setError('2FA is enabled. Please use the Telegram app to sign in.');
      } else {
        setError(data.error || 'Invalid code');
      }
    } catch (err) {
      setError('Failed to verify code');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/telegram/mtproto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'getChats',
          session,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setChats(data.chats.map((chat: any) => ({
          id: chat.id,
          title: chat.title,
          type: chat.type,
          isCreator: chat.isCreator,
          username: chat.username
        })));
      } else {
        console.error('Failed to fetch chats:', data.error);
      }
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('telegramSession');
    setSession('');
    setStep('phone');
    setPhoneNumber('');
    setVerificationCode('');
    setPhoneCodeHash('');
    setChats([]);
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/telegram/mtproto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createChannel',
          title: channelTitle,
          about: channelAbout,
          session,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        setChannelTitle('');
        setChannelAbout('');
        // Refresh the chat list
        fetchChats();
      } else {
        setError(data.error || 'Failed to create channel');
      }
    } catch (err) {
      setError('Failed to create channel');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChannel = async (channelId: number) => {
    if (!confirm('Are you sure you want to delete this channel?')) {
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/telegram/mtproto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteChannel',
          channelId,
          session,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Refresh the chat list
        fetchChats();
      } else {
        setError(data.error || 'Failed to delete channel');
      }
    } catch (err) {
      setError('Failed to delete channel');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = async (chat: Chat) => {
    setSelectedChat(chat);
    setLoading(true);
    try {
      const response = await fetch('/api/telegram/mtproto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getMessages',
          channelId: chat.id,
          session,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      } else {
        setError(data.error || 'Failed to fetch messages');
      }
    } catch (err) {
      setError('Failed to fetch messages');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter(chat => 
    activeFilter === 'all' ? true : chat.type === activeFilter
  );

  const chatCounts = {
    all: chats.length,
    channel: chats.filter(chat => chat.type === 'channel').length,
    group: chats.filter(chat => chat.type === 'group').length,
    bot: chats.filter(chat => chat.type === 'bot').length,
    contact: chats.filter(chat => chat.type === 'contact').length,
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat) return;

    setLoading(true);
    try {
      const response = await fetch('/api/telegram/mtproto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendMessage',
          channelId: selectedChat.id,
          message: messageInput.trim(),
          session,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessageInput('');
        // Refresh messages to show the new message
        handleChatSelect(selectedChat);
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      setError('Failed to send message');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-6xl w-full">
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <h1 className="text-2xl font-bold text-black text-center mb-6">Sign in with Phone Number</h1>
            <div>
              <label className="block text-sm font-medium text-black">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="mt-1 block w-full rounded-md border border-black px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black"
                required
              />
              <p className="mt-1 text-sm text-black">Enter your phone number with country code (e.g., +1234567890)</p>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
              disabled={loading}
            >
              Send Code
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <h1 className="text-2xl font-bold text-black text-center mb-6">Enter Verification Code</h1>
            <div>
              <label className="block text-sm font-medium text-black">Verification Code</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="12345"
                className="mt-1 block w-full rounded-md border border-black px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black"
                required
              />
              <p className="mt-1 text-sm text-black">Enter the code sent to your Telegram app</p>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
              disabled={loading}
            >
              Verify Code
            </button>
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full mt-2 text-black hover:text-black"
            >
              Back to Phone Number
            </button>
          </form>
        )}

        {step === 'authenticated' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-black">Your Chats</h1>
              <div className="space-x-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Create Channel
                </button>
                <button
                  onClick={handleSignOut}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Sign Out
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Chat List */}
              <div className="col-span-1 border-r pr-4 h-[calc(100vh-12rem)] flex flex-col">
                {/* Search Input */}
                <div className="mb-4 sticky top-0 bg-white z-10">
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black"
                  />
                </div>
                {/* Filter Buttons */}
                <div className="mb-4 space-y-2 sticky top-[52px] bg-white">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { type: 'all', icon: '🔍' },
                      { type: 'channel', icon: '📢' },
                      { type: 'group', icon: '👥' },
                      { type: 'bot', icon: '🤖' },
                      { type: 'contact', icon: '👤' }
                    ].map(({ type, icon }) => (
                      <button
                        key={type}
                        onClick={() => setActiveFilter(type as ChatType)}
                        className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1
                          ${activeFilter === type 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        <span>{icon}</span>
                        <span className="capitalize">{type}</span>
                        <span className="ml-1 text-xs">
                          ({chatCounts[type as keyof typeof chatCounts]})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 overflow-y-auto flex-1">
                  {filteredChats
                    .filter(chat => 
                      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => handleChatSelect(chat)}
                      className={`p-3 rounded cursor-pointer hover:bg-gray-100 ${
                        selectedChat?.id === chat.id ? 'bg-gray-100' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-black">{chat.title}</h3>
                          <p className="text-sm text-gray-500">{chat.type}</p>
                        </div>
                        {chat.isCreator && chat.type === 'channel' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChannel(chat.id);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="col-span-2">
                {selectedChat ? (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-black">{selectedChat.title}</h2>
                      <button
                        onClick={() => handleChatSelect(selectedChat)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                      >
                        <span>🔄</span>
                        <span>Refresh</span>
                      </button>
                    </div>
                    <div className="space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
                      {[...messages]
                        .sort((a, b) => a.date - b.date)
                        .map((message) => (
                          <div key={message.id} className="p-4 bg-gray-50 rounded">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <Link 
                                  href={selectedChat.username 
                                    ? `https://t.me/${selectedChat.username}/${message.id}`
                                    : `https://t.me/c/${selectedChat.id.toString().replace('-100', '')}/${message.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-black hover:text-blue-600 whitespace-pre-wrap block"
                                >
                                  {message.message}
                                </Link>
                                {message.media && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    Media: {message.media.type}
                                  </p>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(message.date * 1000).toLocaleString()}
                              </div>
                            </div>
                            {(message.views !== undefined || message.forwards !== undefined) && (
                              <div className="mt-2 text-sm text-gray-500">
                                {message.views !== undefined && (
                                  <span className="mr-4">👁 {message.views}</span>
                                )}
                                {message.forwards !== undefined && (
                                  <span>↪ {message.forwards}</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      <div ref={messagesEndRef} />
                    </div>
                    {/* Message Input */}
                    <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black"
                      />
                      <button
                        type="submit"
                        disabled={!messageInput.trim() || loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Select a chat to view messages
                  </div>
                )}
              </div>
            </div>

            {/* Create Channel Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h2 className="text-xl font-bold text-black mb-4">Create New Channel</h2>
                  <form onSubmit={handleCreateChannel} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black">Channel Title</label>
                      <input
                        type="text"
                        value={channelTitle}
                        onChange={(e) => setChannelTitle(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-black px-3 py-2 text-black"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black">About (Optional)</label>
                      <textarea
                        value={channelAbout}
                        onChange={(e) => setChannelAbout(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-black px-3 py-2 text-black"
                        rows={3}
                      />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="px-4 py-2 text-black border border-black rounded hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        disabled={loading}
                      >
                        Create
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
