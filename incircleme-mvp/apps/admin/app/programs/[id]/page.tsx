'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { ReviewDetail, VerificationTier } from '@incircleme/types';
import type { ReviewGate } from '@incircleme/config';
import { adminApi } from '../../../lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const abs = (url: string) => (url.startsWith('http') ? url : `${BASE}${url}`);
const GOLD = '#7E6410';
const FOREST = '#2E4531';

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5DFD6',
  borderRadius: 12,
  padding: 16,
  marginBottom: 14,
};
const label: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#6B6762', letterSpacing: 0.4, textTransform: 'uppercase' };

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<ReviewDetail | null>(null);
  const [gates, setGates] = useState<ReviewGate[]>([]);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [tier, setTier] = useState<VerificationTier>('verified');
  const [gov, setGov] = useState('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    adminApi.detail(id).then(setD).catch((e) => setError(String(e.message ?? e)));
  };
  useEffect(() => {
    load();
    adminApi.gates().then(setGates).catch(() => {});
  }, [id]);

  if (error) return <p style={{ color: '#A6563A' }}>{error}</p>;
  if (!d) return <p style={{ color: '#6B6762' }}>Loading…</p>;

  const inQueue = d.status === 'pending_review' || d.status === 'under_review';
  const allGatesChecked = gates.every((g) => checks[g.id]);

  const run = async (fn: () => Promise<ReviewDetail>, ok: string) => {
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      setD(await fn());
      setMsg(ok);
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Link href="/" style={{ color: '#A6563A', fontSize: 13, textDecoration: 'none' }}>
        ← Queue
      </Link>
      <h1 style={{ fontSize: 22, margin: '8px 0 2px' }}>{d.title}</h1>
      <p style={{ color: '#6B6762', fontSize: 13, marginTop: 0 }}>
        {d.hostName} · {d.hostTier} · trust: {d.hostTrustTier} · status: <strong>{d.status}</strong>
        {d.verifiedTier ? ` · ${d.verifiedTier}` : ''}
      </p>

      {d.description ? (
        <div style={card}>
          <div style={label}>Description</div>
          <p style={{ margin: '6px 0 0', fontSize: 14 }}>{d.description}</p>
        </div>
      ) : null}

      <div style={card}>
        <div style={label}>Schedule & assessment</div>
        <p style={{ margin: '6px 0 0', fontSize: 14 }}>
          {d.timeFrameSessions ?? '—'} sessions · {d.timeFrameTotalHours ?? '—'} total hours
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#1C1C1E' }}>
          {d.assessmentMethod ?? <span style={{ color: '#A6563A' }}>No assessment method given</span>}
        </p>
      </div>

      <div style={card}>
        <div style={label}>Curriculum</div>
        {d.curriculum.length === 0 ? (
          <p style={{ color: '#A6563A', fontSize: 14 }}>No curriculum provided</p>
        ) : (
          <ol style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 14 }}>
            {d.curriculum.map((w) => (
              <li key={w.week} style={{ marginBottom: 4 }}>
                <strong>{w.title}</strong>
                {w.hours ? ` · ${w.hours}h` : ''}
              </li>
            ))}
          </ol>
        )}
      </div>

      <div style={card}>
        <div style={label}>Accreditation</div>
        <p style={{ margin: '6px 0 0', fontSize: 14 }}>
          {d.accreditationBody ?? '—'} {d.accreditationId ? `· id: ${d.accreditationId}` : ''}
        </p>
      </div>

      <div style={card}>
        <div style={label}>Credentials ({d.credentials.length})</div>
        {d.credentials.length === 0 ? (
          <p style={{ color: '#A6563A', fontSize: 14 }}>None uploaded</p>
        ) : (
          <ul style={{ margin: '8px 0 0', paddingLeft: 0, listStyle: 'none', fontSize: 14 }}>
            {d.credentials.map((c) => (
              <li key={c.id} style={{ marginBottom: 4 }}>
                <a href={abs(c.fileUrl)} target="_blank" rel="noreferrer" style={{ color: '#A6563A' }}>
                  {c.fileKind}
                </a>
                {c.notes ? ` — ${c.notes}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={card}>
        <div style={label}>References ({d.references.length})</div>
        {d.references.length === 0 ? (
          <p style={{ color: '#6B6762', fontSize: 14 }}>None</p>
        ) : (
          <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 14 }}>
            {d.references.map((r, i) => (
              <li key={i}>
                {r.name}
                {r.role ? ` · ${r.role}` : ''}
                {r.contact ? ` · ${r.contact}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>

      {msg ? <p style={{ color: FOREST, fontWeight: 600 }}>{msg}</p> : null}
      {error ? <p style={{ color: '#A6563A', fontWeight: 600 }}>{error}</p> : null}

      {inQueue ? (
        <div style={{ ...card, borderColor: '#D4C9B6' }}>
          <div style={label}>Decision — 4-gate review</div>
          {gates.map((g) => (
            <label key={g.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '8px 0', fontSize: 13.5 }}>
              <input
                type="checkbox"
                checked={!!checks[g.id]}
                onChange={(e) => setChecks((c) => ({ ...c, [g.id]: e.target.checked }))}
              />
              <span>{g.label}</span>
            </label>
          ))}

          <div style={{ marginTop: 14 }}>
            <div style={label}>Tier</div>
            <div style={{ display: 'flex', gap: 16, margin: '8px 0' }}>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14, color: GOLD, fontWeight: 600 }}>
                <input type="radio" name="tier" checked={tier === 'verified'} onChange={() => setTier('verified')} />
                Verified (gold seal)
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14, color: FOREST, fontWeight: 600 }}>
                <input type="radio" name="tier" checked={tier === 'accredited'} onChange={() => setTier('accredited')} />
                Accredited (governing body)
              </label>
            </div>
            {tier === 'accredited' ? (
              <input
                placeholder="Governing-body URL (required for accredited)"
                value={gov}
                onChange={(e) => setGov(e.target.value)}
                style={{ width: '100%', padding: '9px 11px', border: '1px solid #E5DFD6', borderRadius: 8, fontSize: 13.5, boxSizing: 'border-box' }}
              />
            ) : null}
          </div>

          <textarea
            placeholder="Internal review notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: '100%', minHeight: 50, marginTop: 10, padding: '9px 11px', border: '1px solid #E5DFD6', borderRadius: 8, fontSize: 13.5, boxSizing: 'border-box' }}
          />

          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <button
              disabled={busy || !allGatesChecked || (tier === 'accredited' && !gov.trim())}
              onClick={() =>
                run(
                  () => adminApi.verify(id, { tier, governingBodyUrl: gov.trim() || undefined, gateChecks: checks, notes: notes.trim() || undefined }),
                  `Verified as ${tier}.`,
                )
              }
              style={{ background: FOREST, color: '#F7F3ED', border: 0, borderRadius: 999, padding: '10px 18px', fontWeight: 600, cursor: 'pointer', opacity: busy || !allGatesChecked ? 0.5 : 1 }}
            >
              Verify
            </button>
            <button
              disabled={busy}
              onClick={() => run(() => adminApi.underReview(id), 'Marked under review.')}
              style={{ background: '#FFFFFF', color: '#1C1C1E', border: '1px solid #E5DFD6', borderRadius: 999, padding: '10px 18px', fontWeight: 600, cursor: 'pointer' }}
            >
              Under review
            </button>
          </div>

          <div style={{ marginTop: 16, borderTop: '1px solid #EFE8DC', paddingTop: 12 }}>
            <div style={label}>Not approved</div>
            <textarea
              placeholder="Reason (sent to the host; the €150 fee is refunded)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: '100%', minHeight: 50, marginTop: 8, padding: '9px 11px', border: '1px solid #E5DFD6', borderRadius: 8, fontSize: 13.5, boxSizing: 'border-box' }}
            />
            <button
              disabled={busy || !reason.trim()}
              onClick={() => run(() => adminApi.reject(id, reason.trim()), 'Not approved — fee refunded if one was charged.')}
              style={{ marginTop: 8, background: '#FFFFFF', color: '#A6563A', border: '1px solid #A6563A', borderRadius: 999, padding: '9px 18px', fontWeight: 600, cursor: 'pointer', opacity: busy || !reason.trim() ? 0.5 : 1 }}
            >
              Not approved
            </button>
          </div>
        </div>
      ) : (
        <div style={{ ...card, borderColor: '#D4C9B6' }}>
          <div style={label}>Outcome</div>
          <p style={{ margin: '6px 0 0', fontSize: 14 }}>
            {d.status === 'verified'
              ? `Verified · ${d.verifiedTier}${d.governingBodyUrl ? ` · ${d.governingBodyUrl}` : ''}`
              : d.status === 'rejected'
                ? `Not approved · ${d.rejectionReason ?? ''}`
                : d.status}
          </p>
        </div>
      )}
    </div>
  );
}
