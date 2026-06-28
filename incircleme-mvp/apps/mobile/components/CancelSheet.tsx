// Cancel-seat sheet — promise-delivery: fetch the server's cancel-quote and render the
// EXACT refund/credit/deposit outcome BEFORE the attendee confirms. All states present
// (quote loading, quote error+retry, submitting, success, submit error+retry) — no blank.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import type { CancelQuote } from '@incircleme/types';
import { interpolate, t } from '@incircleme/i18n';
import { api } from '../lib/api';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

const euros = (cents: number): string => {
  const v = cents / 100;
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
};

type Phase = 'loading' | 'quoteError' | 'ready' | 'submitting' | 'error' | 'success';

export function CancelSheet({
  bookingId,
  amountCents,
  visible,
  onClose,
  onCancelled,
}: {
  bookingId: string;
  amountCents: number;
  visible: boolean;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [quote, setQuote] = useState<CancelQuote | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');

  const loadQuote = () => {
    setPhase('loading');
    api
      .cancelQuote(bookingId)
      .then((q) => {
        setQuote(q);
        setPhase('ready');
      })
      .catch(() => setPhase('quoteError'));
  };

  useEffect(() => {
    if (visible) loadQuote();
  }, [visible, bookingId]);

  // Success auto-dismisses → parent re-fetches and shows the cancelled state.
  useEffect(() => {
    if (phase !== 'success') return;
    const id = setTimeout(() => {
      onCancelled();
      onClose();
    }, 1400);
    return () => clearTimeout(id);
  }, [phase]);

  const confirm = () => {
    setPhase('submitting');
    api
      .cancelBooking(bookingId)
      .then(() => setPhase('success'))
      .catch(() => setPhase('error'));
  };

  const bodyText = (): string | null => {
    if (!quote) return null;
    if (quote.refundStatus === 'full' && quote.refundCents > 0)
      return interpolate(t('cs_bodyRefund'), { amount: euros(amountCents) });
    if (quote.creditCents > 0)
      return interpolate(t('cs_bodyCredit'), {
        amount: euros(quote.creditCents),
        hours: String(quote.cutoffHours),
      });
    return interpolate(t('cs_bodyNoRefund'), { hours: String(quote.cutoffHours) });
  };
  const depositLine = quote?.hasDeposit
    ? quote.depositForfeited
      ? t('cs_depositForfeit')
      : t('cs_depositRefund')
    : null;

  const busy = phase === 'submitting';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={busy ? undefined : onClose}>
      <Pressable style={styles.scrim} onPress={busy ? undefined : onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {phase === 'loading' ? (
            <View style={styles.box}>
              <ActivityIndicator color={tokens.color.forest} />
            </View>
          ) : phase === 'quoteError' ? (
            <>
              <Text style={styles.title}>{t('cs_title')}</Text>
              <Pressable style={styles.primary} onPress={loadQuote} accessibilityRole="button">
                <Text style={styles.primaryText}>{t('cs_errorRetry')}</Text>
              </Pressable>
              <Pressable style={styles.ghost} onPress={onClose} accessibilityRole="button">
                <Text style={styles.ghostText}>{t('cs_keep')}</Text>
              </Pressable>
            </>
          ) : phase === 'success' ? (
            <View style={styles.box}>
              <CheckCircle2 size={30} color={tokens.color.forest} strokeWidth={2} />
              <Text style={styles.successTitle}>{t('cs_successTitle')}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.title}>{t('cs_title')}</Text>
              {bodyText() ? <Text style={styles.body}>{bodyText()}</Text> : null}
              {depositLine ? <Text style={styles.deposit}>{depositLine}</Text> : null}
              {phase === 'error' ? <Text style={styles.errorText}>{t('cs_errorRetry')}</Text> : null}
              <Pressable
                style={[styles.primary, busy && styles.primaryBusy]}
                onPress={confirm}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={t('cs_confirm')}
              >
                {busy ? (
                  <ActivityIndicator color={tokens.color.cream} />
                ) : (
                  <Text style={styles.primaryText}>{t('cs_confirm')}</Text>
                )}
              </Pressable>
              <Pressable
                style={styles.ghost}
                onPress={onClose}
                disabled={busy}
                accessibilityRole="button"
              >
                <Text style={styles.ghostText}>{t('cs_keep')}</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(28,28,30,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: tokens.color.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28,
    gap: 12,
  },
  box: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 24 },
  title: { fontFamily: fonts.display, fontSize: 20, color: tokens.color.ink },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: tokens.color.text2 },
  deposit: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 19, color: tokens.color.forest },
  errorText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: tokens.color.coralInk },
  successTitle: { fontFamily: fonts.display, fontSize: 18, color: tokens.color.ink },
  primary: {
    backgroundColor: tokens.color.forest,
    borderRadius: 14,
    paddingVertical: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryBusy: { opacity: 0.85 },
  primaryText: { fontFamily: fonts.bodySemi, fontSize: 15, color: tokens.color.cream },
  ghost: { paddingVertical: 12, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: tokens.color.ink },
});
