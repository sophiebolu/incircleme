import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { PublicProgramCard } from '@incircleme/types';
import { t } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { tierColor, tierLabel } from '../../lib/programTier';
import { BrandBar } from '../../components/BrandBar';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

export default function BrowsePrograms() {
  const router = useRouter();
  const [programs, setPrograms] = useState<PublicProgramCard[] | null>(null);

  useEffect(() => {
    api
      .listPublicPrograms()
      .then(setPrograms)
      .catch(() => setPrograms([]));
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <Text style={styles.back}>←</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.eyebrow}>{t('prog_pub_eyebrow')}</Text>
        {(programs ?? []).map((p) => (
          <Pressable key={p.id} style={styles.card} onPress={() => router.push(`/program/${p.id}`)}>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.title}>{p.title}</Text>
              <Text style={styles.meta}>
                {[p.hostName, p.neighbourhood].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <View style={[styles.badge, { borderColor: tierColor(p.verifiedTier) }]}>
              <Text style={[styles.badgeText, { color: tierColor(p.verifiedTier) }]}>
                {tierLabel(p.verifiedTier)}
              </Text>
            </View>
          </Pressable>
        ))}
        <Text style={styles.trust}>{t('prog_pub_trustLine')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  back: { fontSize: 22, color: tokens.color.ink, paddingHorizontal: 16, paddingTop: 8 },
  body: { padding: 16, gap: 12 },
  eyebrow: { fontFamily: fonts.displayItalic, fontSize: 18, color: tokens.color.forest },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: { fontFamily: fonts.displaySemi, fontSize: 16, color: tokens.color.ink },
  meta: { fontFamily: fonts.body, fontSize: 12.5, color: tokens.color.text2, marginTop: 2 },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 10.5 },
  trust: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.text2, marginTop: 4 },
});
