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

  // Fresh start: clear any draft left over from a prior, abandoned run of the flow.
  useEffect(() => {
    resetOnbDraft();
  }, []);

  const toggle = (k: string) =>
    setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  async function next() {
    setBusy(true);
    try {
      onbDraft.moodTiles = picked;
      await api.updateMe({ intents: picked });
      router.push('/onboarding/interests');
    } finally {
      setBusy(false);
    }
  }

  return (
    <OnbScaffold
      step={1}
      footer={
        <OnbButton
          label={t('onb_intent_continue')}
          onPress={next}
          disabled={busy || picked.length < MIN_INTENTS}
        />
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
              <Text style={styles.tileTitle}>{t(tile.label)}</Text>
              <Text style={styles.tileSub}>{t(tile.sub)}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.footerNote}>{t('onb_intent_footer')}</Text>
    </OnbScaffold>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  tile: {
    width: '47%',
    borderWidth: 1,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.bg2,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  tileOn: { borderColor: tokens.color.coral, backgroundColor: tokens.color.cream },
  emoji: { fontSize: 26, marginBottom: 8 },
  tileTitle: { fontFamily: fonts.bodySemi, fontSize: 15, color: tokens.color.ink },
  tileSub: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: tokens.color.text2, marginTop: 4 },
  footerNote: { fontFamily: fonts.body, fontSize: 12, color: tokens.color.text2, textAlign: 'center', marginTop: 8 },
});
