import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { t } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import { OnbButton, OnbScaffold } from '../../components/Onb';
import { BARRIO_OTHER, BARRIOS } from '../../lib/onboarding';

export default function Barrio() {
  const router = useRouter();
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function next() {
    if (!picked) return;
    setBusy(true);
    try {
      await api.updateMe({ neighbourhood: picked });
      router.push('/onboarding/notifications');
    } finally {
      setBusy(false);
    }
  }

  return (
    <OnbScaffold
      step={3}
      footer={<OnbButton label={t('onb_barrio_continue')} onPress={next} disabled={busy || !picked} />}
    >
      <Text style={styles.title}>{t('onb_barrio_title')}</Text>
      <Text style={styles.sub}>{t('onb_barrio_sub')}</Text>
      <View style={styles.grid}>
        {BARRIOS.map((b) => {
          const on = picked === b.key;
          return (
            <Pressable
              key={b.key}
              onPress={() => setPicked(b.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t(b.label)}
              style={[styles.tile, on && styles.tileOn]}
            >
              <Text style={[styles.tileText, on && styles.tileTextOn]}>{t(b.label)}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        onPress={() => setPicked(BARRIO_OTHER)}
        accessibilityRole="radio"
        accessibilityState={{ selected: picked === BARRIO_OTHER }}
        style={[styles.other, picked === BARRIO_OTHER && styles.tileOn]}
      >
        <Text style={[styles.tileText, picked === BARRIO_OTHER && styles.tileTextOn]}>
          {t('onb_barrio_notListed')}
        </Text>
      </Pressable>
      <Text style={styles.waitlist}>{t('onb_barrio_waitlist')}</Text>
    </OnbScaffold>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 28, color: tokens.color.ink, marginTop: 4 },
  sub: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: tokens.color.text2, marginTop: 6, marginBottom: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    borderWidth: 1,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.bg2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tileOn: { borderColor: tokens.color.coral, backgroundColor: tokens.color.coral },
  tileText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: tokens.color.ink },
  tileTextOn: { color: tokens.color.cream },
  other: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    alignItems: 'center',
  },
  waitlist: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20, color: tokens.color.text2, marginTop: 18 },
});
