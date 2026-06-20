import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { t } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import { OnbButton, OnbScaffold } from '../../components/Onb';
import { INTENT_TILES, onbDraft } from '../../lib/onboarding';

export default function Intent() {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
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
      footer={<OnbButton label={t('onb_intent_continue')} onPress={next} disabled={busy || picked.length === 0} />}
    >
      <Text style={styles.title}>{t('onb_intent_title')}</Text>
      <Text style={styles.sub}>{t('onb_intent_sub')}</Text>
      <View style={styles.grid}>
        {INTENT_TILES.map((tile) => {
          const on = picked.includes(tile.key);
          return (
            <Pressable
              key={tile.key}
              onPress={() => toggle(tile.key)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={t(tile.label)}
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
  title: { fontFamily: fonts.display, fontSize: 28, color: tokens.color.ink, marginTop: 4 },
  sub: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: tokens.color.text2, marginTop: 6, marginBottom: 18 },
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
  footerNote: { fontFamily: fonts.body, fontSize: 12, color: tokens.color.gray, textAlign: 'center', marginTop: 8 },
});
