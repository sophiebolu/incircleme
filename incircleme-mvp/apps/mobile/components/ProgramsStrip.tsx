import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { PublicProgramCard } from '@incircleme/types';
import { t } from '@incircleme/i18n';
import { api } from '../lib/api';
import { tierColor, tierLabel } from '../lib/programTier';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

// Home strip — surfaces verified Programs (§24). Tap a card → public detail;
// tap the eyebrow → the full listing. Hidden until at least one Program is verified.
export function ProgramsStrip() {
  const router = useRouter();
  const [programs, setPrograms] = useState<PublicProgramCard[] | null>(null);

  useEffect(() => {
    api
      .listPublicPrograms()
      .then(setPrograms)
      .catch(() => setPrograms([]));
  }, []);

  if (!programs || programs.length === 0) return null;

  return (
    <View>
      <Pressable onPress={() => router.push('/programs/browse')}>
        <Text style={styles.eyebrow}>{t('prog_pub_eyebrow')}</Text>
      </Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {programs.map((p) => (
          <Pressable key={p.id} style={styles.card} onPress={() => router.push(`/program/${p.id}`)}>
            <View style={styles.photo}>
              <View style={[styles.badge, { borderColor: tierColor(p.verifiedTier) }]}>
                <Text style={[styles.badgeText, { color: tierColor(p.verifiedTier) }]}>
                  {tierLabel(p.verifiedTier)}
                </Text>
              </View>
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {p.title}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {p.hostName}
              {p.neighbourhood ? ` · ${p.neighbourhood}` : ''}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.trust}>{t('prog_pub_trustLine')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: fonts.displayItalic,
    fontSize: 15,
    color: tokens.color.forest,
    marginBottom: 10,
  },
  row: { gap: 10, paddingRight: 16 },
  card: { width: 150 },
  photo: {
    width: 150,
    height: 96,
    borderRadius: 12,
    backgroundColor: tokens.color.forestSoft,
    marginBottom: 6,
    padding: 7,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: '#FFFFFF',
  },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 9.5 },
  title: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.ink },
  meta: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.text2 },
  trust: { fontFamily: fonts.body, fontSize: 11, color: tokens.color.text2, marginTop: 10 },
});
