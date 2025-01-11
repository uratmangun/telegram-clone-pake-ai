'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EntityDetails {
  id: string;
  title: string;
  type: string;
  username?: string;
  phone?: string;
  participantsCount?: number;
  about?: string;
  isVerified?: boolean;
  isRestricted?: boolean;
  isFake?: boolean;
  isScam?: boolean;
  entityType?: string;
  isBroadcast?: boolean;
  isMegagroup?: boolean;
}

export default function EntityDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [details, setDetails] = useState<EntityDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = localStorage.getItem('telegramSession');
    if (!session) {
      router.push('/');
      return;
    }

    async function fetchDetails() {
      try {
        const response = await fetch('/api/telegram/mtproto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'getEntityDetails',
            id: params.id,
            session,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setDetails(data.details);
        } else {
          setError(data.error || 'Failed to fetch details');
        }
      } catch (err) {
        setError('Failed to fetch entity details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/" className="text-blue-500 hover:underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-black mb-4">Entity not found</p>
          <Link href="/" className="text-blue-500 hover:underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <div className="mb-6">
          <Link href="/" className="text-blue-500 hover:underline">← Back to Home</Link>
        </div>
        
        <h1 className="text-2xl font-bold text-black mb-6">{details.title}</h1>
        
        <div className="space-y-4">
          <div className="border border-black rounded-lg p-4">
            <h2 className="text-lg font-semibold text-black mb-4">Basic Information</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-black">ID</dt>
                <dd className="text-black">{details.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-black">Type</dt>
                <dd className="text-black capitalize">{details.type}</dd>
              </div>
              {details.entityType && (
                <div>
                  <dt className="text-sm font-medium text-black">Entity Type</dt>
                  <dd className="text-black">{details.entityType}</dd>
                </div>
              )}
              {details.isBroadcast !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-black">Is Broadcast Channel</dt>
                  <dd className="text-black">{details.isBroadcast ? 'Yes' : 'No'}</dd>
                </div>
              )}
              {details.isMegagroup !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-black">Is Supergroup</dt>
                  <dd className="text-black">{details.isMegagroup ? 'Yes' : 'No'}</dd>
                </div>
              )}
              {details.username && (
                <div>
                  <dt className="text-sm font-medium text-black">Username</dt>
                  <dd className="text-black">@{details.username}</dd>
                </div>
              )}
              {details.phone && (
                <div>
                  <dt className="text-sm font-medium text-black">Phone</dt>
                  <dd className="text-black">{details.phone}</dd>
                </div>
              )}
              {details.participantsCount !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-black">Participants</dt>
                  <dd className="text-black">{details.participantsCount}</dd>
                </div>
              )}
            </dl>
          </div>

          {details.about && (
            <div className="border border-black rounded-lg p-4">
              <h2 className="text-lg font-semibold text-black mb-2">About</h2>
              <p className="text-black whitespace-pre-wrap">{details.about}</p>
            </div>
          )}

          <div className="border border-black rounded-lg p-4">
            <h2 className="text-lg font-semibold text-black mb-4">Status</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-black">Verified</dt>
                <dd className="text-black">{details.isVerified ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-black">Restricted</dt>
                <dd className="text-black">{details.isRestricted ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-black">Fake</dt>
                <dd className="text-black">{details.isFake ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-black">Scam</dt>
                <dd className="text-black">{details.isScam ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </main>
  );
} 