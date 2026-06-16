'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ReviewQueueItem } from '@incircleme/types';
import { adminApi } from '../lib/api';

const STATUS_LABEL: Record<string, string> = {
  pending_review: 'Pending review',
  under_review: 'Under review',
};

export default function QueuePage() {
  const [items, setItems] = useState<ReviewQueueItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .queue()
      .then(setItems)
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  if (error) return <p style={{ color: '#A6563A' }}>{error}</p>;
  if (!items) return <p style={{ color: '#6B6762' }}>Loading…</p>;

  return (
    <div>
      <h1 style={{ fontSize: 22, margin: '0 0 4px' }}>Review queue</h1>
      <p style={{ color: '#6B6762', fontSize: 13, marginTop: 0 }}>
        {items.length} Program{items.length === 1 ? '' : 's'} awaiting a Trust decision.
      </p>
      {items.length === 0 ? (
        <p style={{ color: '#6B6762' }}>Nothing in the queue.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10 }}>
          {items.map((p) => (
            <li key={p.id}>
              <Link
                href={`/programs/${p.id}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  background: '#FFFFFF',
                  border: '1px solid #E5DFD6',
                  borderRadius: 12,
                  padding: '14px 16px',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <span>
                  <strong style={{ fontSize: 15 }}>{p.title}</strong>
                  <span style={{ color: '#6B6762', fontSize: 12.5, display: 'block', marginTop: 2 }}>
                    {p.hostName} · {p.hostTier} · {p.credentialCount} credential
                    {p.credentialCount === 1 ? '' : 's'}
                    {p.accreditationBody ? ` · ${p.accreditationBody}` : ''}
                  </span>
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    color: p.status === 'under_review' ? '#7E6410' : '#A6563A',
                  }}
                >
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
