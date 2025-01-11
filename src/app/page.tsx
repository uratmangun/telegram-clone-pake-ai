'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Chat {
  id: number;
  title: string;
  type: 'channel' | 'group' | 'bot' | 'contact';
}

export default function Home() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [step, setStep] = useState<'phone' | 'code' | 'authenticated'>('phone');
  const [chats, setChats] = useState<Chat[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('telegramSession') || '';
    }
    return '';
  });

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full">
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
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-black text-center mb-6">Your Telegram Chats</h1>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-black">Channels</h2>
              <div className="space-y-2">
                {chats.filter(chat => chat.type === 'channel').map(chat => (
                  <Link 
                    key={chat.id} 
                    href={`/details/${chat.id}`}
                    className="block p-4 border border-black rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <p className="font-medium text-black">{chat.title}</p>
                  </Link>
                ))}
              </div>
              
              <h2 className="text-xl font-semibold text-black mt-6">Groups</h2>
              <div className="space-y-2">
                {chats.filter(chat => chat.type === 'group').map(chat => (
                  <Link 
                    key={chat.id} 
                    href={`/details/${chat.id}`}
                    className="block p-4 border border-black rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <p className="font-medium text-black">{chat.title}</p>
                  </Link>
                ))}
              </div>
              
              <h2 className="text-xl font-semibold text-black mt-6">Bots</h2>
              <div className="space-y-2">
                {chats.filter(chat => chat.type === 'bot').map(chat => (
                  <Link 
                    key={chat.id} 
                    href={`/details/${chat.id}`}
                    className="block p-4 border border-black rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <p className="font-medium text-black">{chat.title}</p>
                  </Link>
                ))}
              </div>

              <h2 className="text-xl font-semibold text-black mt-6">Contacts</h2>
              <div className="space-y-2">
                {chats.filter(chat => chat.type === 'contact').map(chat => (
                  <Link 
                    key={chat.id} 
                    href={`/details/${chat.id}`}
                    className="block p-4 border border-black rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <p className="font-medium text-black">{chat.title}</p>
                  </Link>
                ))}
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors mt-6"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
