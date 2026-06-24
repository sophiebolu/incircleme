import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { interpolate, t } from '@incircleme/i18n';
import type { StringKey } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import { OnbButton, OnbScaffold } from '../../components/Onb';
import { GOAL_PILLS, INTEREST_PILLS, MIN_INTERESTS, onbDraft } from '../../lib/onboarding';

export default function Interests() {
  const router = useRouter();
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const toggle = (set: (f: (p: string[]) => string[]) => void) => (k: string) =>
    set((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  async function next() {
    setBusy(true);
    try {
      onbDraft.goals = goals;
      // The "I'm here to…" goals fold into intents[], alongside the mood-tiles seeded earlier.
      const intents = [...onbDraft.moodTiles, ...goals];
      await api.updateMe({ interests, intents });
      router.push('/onboarding/barrio');
    } finally {
      setBusy(false);
    }
  }

  return (
    <OnbScaffold
      step={2}
      footer={
        <View style={styles.footerCol}>
          {interests.length < MIN_INTERESTS ? (
            <Text style={styles.need}>
              {interpolate(t('onb_interests_need'), { n: String(MIN_INTERESTS - interests.length) })}
            </Text>
          ) : null}
          <OnbButton
            label={t('onb_interests_continue')}
            onPress={next}
            disabled={busy || interests.length < MIN_INTERESTS}
          />
        </View>
      }
    >
      <Text style={styles.title}>{t('onb_interests_title')}</Text>
      <Text style={styles.sub}>{t('onb_interests_sub')}</Text>
      <View style={styles.pills}>
        {INTEREST_PILLS.map((p) => (
          <Pill key={p.key} label={p.label} on={interests.includes(p.key)} onPress={() => toggle(setInterests)(p.key)} hash />
        ))}
      </View>
      <Text style={styles.groupLabel}>{t('onb_goals_label')}</Text>
      <View style={styles.pills}>
        {GOAL_PILLS.map((p) => (
          <Pill key={p.key} label={p.label} on={goals.includes(p.key)} onPress={() => toggle(setGoals)(p.key)} />
        ))}
      </View>
      <Text style={styles.footerNote}>{t('onb_interests_footer')}</Text>
    </OnbScaffold>
  );
}

function Pill({ label, on, onPress, hash }: { label: StringKey; on: boolean; onPress: () => void; hash?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={t(label)}
      style={[styles.pill, on && styles.pillOn]}
    >
      <Text style={[styles.pillText, on && styles.pillTextOn]}>
        {hash ? '#' : ''}
        {t(label)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: tokens.color.ink, marginTop: 4 },
  sub: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: tokens.color.text2, marginTop: 6, marginBottom: 18 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  groupLabel: { fontFamily: fonts.bodySemi, fontSize: 14, color: tokens.color.ink, marginTop: 24, marginBottom: 12 },
  pill: {
    borderWidth: 1,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.bg2,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pillOn: { borderColor: tokens.color.coral, backgroundColor: tokens.color.coral },
  pillText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: tokens.color.ink },
  pillTextOn: { color: tokens.color.cream },
  footerNote: { fontFamily: fonts.body, fontSize: 12, color: tokens.color.gray, textAlign: 'center', marginTop: 24 },
  footerCol: { gap: 8 },
  need: { fontFamily: fonts.bodyMedium, fontSize: 13, color: tokens.color.text2, textAlign: 'center' },
});
