import { describe, it, expect, afterAll } from 'vitest';
import { pool } from '@incircleme/db';
import { ECONOMICS } from '@incircleme/config';
import { FakePayments } from '../src/lib/payments';

// Deposit groundwork, Layer 1 (ADR D5) — scaffolding only. These assert the surface exists +
// defaults correctly; the auth lifecycle itself (Layers 2 & 3) is deferred and untested here.

afterAll(async () => {
  await pool.end();
});

describe('deposit groundwork — schema', () => {
  it('bookings has the deposit auth-lifecycle columns with correct defaults', async () => {
    const { rows } = await pool.query(
      `select column_name, column_default, is_nullable from information_schema.columns
       where table_name = 'bookings' and column_name = any($1)`,
      [['deposit_cents', 'deposit_payment_method_id', 'deposit_auth_intent_id', 'deposit_auth_status']],
    );
    const by = Object.fromEntries(rows.map((r) => [r.column_name, r]));
    expect(by['deposit_cents']).toBeDefined(); // pre-existing (Stage 1)
    expect(by['deposit_auth_status'].is_nullable).toBe('NO');
    expect(by['deposit_auth_status'].column_default).toContain("'none'");
    expect(by['deposit_payment_method_id'].is_nullable).toBe('YES');
    expect(by['deposit_auth_intent_id'].is_nullable).toBe('YES');
  });

  it('users has stripe_customer_id (nullable scaffolding)', async () => {
    const { rows } = await pool.query(
      `select is_nullable from information_schema.columns
       where table_name = 'users' and column_name = 'stripe_customer_id'`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].is_nullable).toBe('YES');
  });
});

describe('deposit groundwork — config knobs', () => {
  it('exposes the locked deposit knobs', () => {
    expect(ECONOMICS.deposit.depositCents).toBe(500);
    expect(ECONOMICS.deposit.authorizeHoursBeforeEvent).toBe(144);
    expect(ECONOMICS.deposit.authStatuses).toContain('authorized');
    expect(ECONOMICS.deposit.authStatuses).toContain('released');
  });
});

describe('deposit groundwork — payments port (stub)', () => {
  it('FakePayments exposes and records each of the 4 deposit methods', async () => {
    const p = new FakePayments();
    const saved = await p.saveCardForDeposit({ customerId: 'cus_1', bookingId: 'b1' });
    const auth = await p.authorizeDeposit({
      bookingId: 'b1',
      amountCents: ECONOMICS.deposit.depositCents,
      customerId: 'cus_1',
      paymentMethodId: 'pm_1',
    });
    await p.captureDeposit({ authIntentId: auth.authIntentId });
    await p.releaseDeposit({ authIntentId: auth.authIntentId });

    expect(saved.clientSecret).toMatch(/^seti_test_/);
    expect(auth.authIntentId).toMatch(/^pi_deposit_test_/);
    expect(p.savedCards).toHaveLength(1);
    expect(p.authorizedDeposits[0]!.amountCents).toBe(500);
    expect(p.capturedDeposits).toHaveLength(1);
    expect(p.releasedDeposits).toHaveLength(1);
  });
});
