import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { t } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import { OnbButton, OnbScaffold, OnbSub, OnbTitle } from '../../components/Onb';
import { INTENT_TILES, MIN_INTENTS, onbDraft, resetOnbDraft } from '../../lib/onboarding';

export default function Intent() {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fresh start: clear any draft left over from a prior, abandoned run of the flow.
  useEffect(() => {
    resetOnbDraft();
  }, []);

  const toggle = (k: string) =>
    setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  async function next() {
    setBusy(true);
    setError(null);
    try {
      onbDraft.moodTiles = picked;
      await api.updateMe({ intents: picked });
      router.push('/onboarding/interests');
    } catch {
      setError(t('onb_error_retry'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <OnbScaffold
      step={1}
      footer={
        <View style={styles.footerCol}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <OnbButton
            label={t('onb_intent_continue')}
            onPress={next}
            disabled={picked.length < MIN_INTENTS}
            busy={busy}
          />
        </View>
      }
    >
      <OnbTitle>{t('onb_intent_title')}</OnbTitle>
      <OnbSub>{t('onb_intent_sub')}</OnbSub>
      <View style={styles.grid}>
        {INTENT_TILES.map((tile) => {
          const on = picked.includes(tile.key);
          return (
            <Pressable
              key={tile.key}
              onPress={() => toggle(tile.key)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${t(tile.label)}. ${t(tile.sub)}`}
              style={[styles.tile, on && styles.tileOn]}
            >
              <Text style={styles.emoji}>{tile.emoji}</Text>
              <Text style={[styles.tileTitle, on && styles.tileTitleOn]}>{t(tile.label)}</Text>
              <Text style={[styles.tileSub, on && styles.tileSubOn]}>{t(tile.sub)}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.footerNote}>{t('onb_intent_footer')}</Text>
    </OnbScaffold>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  tile: {
    width: '47%',
    borderWidth: 1,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.bg2,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  // P3 contrast fix: coralInk bg (#A6563A) → cream text = 4.73:1 ≥ 4.5 AA pass.
  tileOn: { borderColor: tokens.color.coralInk, backgroundColor: tokens.color.coralInk },
  emoji: { fontSize: 26, marginBottom: 8 },
  tileTitle: { fontFamily: fonts.bodySemi, fontSize: 15, color: tokens.color.ink },
  tileTitleOn: { color: tokens.color.cream },
  tileSub: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: tokens.color.text2, marginTop: 4 },
  tileSubOn: { color: tokens.color.cream },
  footerNote: { fontFamily: fonts.body, fontSize: 12, color: tokens.color.text2, textAlign: 'center', marginTop: 8 },
  footerCol: { gap: 8 },
  errorText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: tokens.color.coralInk, textAlign: 'center' },
});
