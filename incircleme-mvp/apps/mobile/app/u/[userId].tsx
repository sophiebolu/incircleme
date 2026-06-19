import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Calendar,
  Check,
  CheckCircle2,
  Languages,
  MapPin,
  MoreVertical,
  Repeat,
  Star,
  UserPlus,
} from 'lucide-react-native';
import type { PublicProfile } from '@incircleme/types';
import { formatDate, interpolate, t } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { tierLabel } from '../../lib/trustTier';
import { BrandBar } from '../../components/BrandBar';
import { EventCard } from '../../components/EventCard';
import { useNavClearance } from '../../lib/useNavClearance';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const navClearance = useNavClearance();

  useEffect(() => {
    if (userId) api.getPublicProfile(userId).then(setProfile).catch(() => setProfile(null));
  }, [userId]);

  // Keep-close (follow) + Report have no backend yet → a brief "coming soon".
  const comingSoon = () => {
    setNotice(t('prof_comingSoon'));
    setTimeout(() => setNotice(null), 1800);
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandBar />
      </SafeAreaView>
    );
  }

  const name = profile.displayName ?? '—';
  const initial = name.charAt(0).toUpperCase();
  const tenure = interpolate(t('prof_joined'), {
    date: formatDate(profile.joinedAt, { month: 'long', year: 'numeric' }),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={comingSoon} hitSlop={10} accessibilityLabel={t('up_report')}>
          <MoreVertical size={20} color={tokens.color.ink} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: navClearance }]}>
        {/* Hero avatar + verified badge */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
            {profile.verified ? (
              <View style={styles.verified} accessibilityLabel={t('prof_verified')}>
                <Check size={13} color={tokens.color.cream} strokeWidth={3} />
              </View>
            ) : null}
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.tier}>{tierLabel(profile.trustTier)}</Text>

          {/* Meta chips — location + (single content-)language */}
          <View style={styles.metaRow}>
            {profile.neighbourhood ? (
              <View style={styles.metaChip}>
                <MapPin size={12} color={tokens.color.text2} strokeWidth={2} />
                <Text style={styles.metaText}>{profile.neighbourhood}</Text>
              </View>
            ) : null}
            <View style={styles.metaChip}>
              <Languages size={12} color={tokens.color.text2} strokeWidth={2} />
              <Text style={styles.metaText}>{profile.language.toUpperCase()}</Text>
            </View>
          </View>

          {/* Keep close — locked §1 verb (follow backend not built → coming soon) */}
          <Pressable style={styles.keepClose} onPress={comingSoon}>
            <UserPlus size={15} color={tokens.color.cream} strokeWidth={2} />
            <Text style={styles.keepCloseText}>{t('keepClose')}</Text>
          </Pressable>
        </View>

        {/* About */}
        {profile.bio ? (
          <>
            <Text style={styles.sectionTitle}>{t('up_about')}</Text>
            <View style={styles.card}>
              <Text style={styles.bio}>{profile.bio}</Text>
            </View>
          </>
        ) : null}

        {/* Their rooms — upcoming events, each → event detail */}
        {profile.upcomingEvents.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>{t('up_theirEvents')}</Text>
            <View style={styles.events}>
              {profile.upcomingEvents.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </View>
          </>
        ) : null}

        {/* Reputation — INLINE summary (never navigates to the self-Passport) */}
        <Text style={styles.sectionTitle}>{t('up_reputation')}</Text>
        <View style={styles.repCard}>
          <Text style={styles.repTier}>{tierLabel(profile.trustTier)}</Text>
          <View style={styles.pills}>
            {profile.verified ? (
              <View style={styles.pill}>
                <CheckCircle2 size={12} color={tokens.color.forest} strokeWidth={2} />
                <Text style={styles.pillText}>{t('prof_verified')}</Text>
              </View>
            ) : null}
            <View style={styles.pill}>
              <Calendar size={12} color={tokens.color.forest} strokeWidth={2} />
              <Text style={styles.pillText}>{tenure}</Text>
            </View>
            <View style={styles.pill}>
              <Repeat size={12} color={tokens.color.forest} strokeWidth={2} />
              <Text style={styles.pillText}>
                {interpolate(t('ev_eventsHosted'), { n: String(profile.eventsHosted) })}
              </Text>
            </View>
            {profile.reviews.count > 0 ? (
              <View style={styles.pill}>
                <Star size={12} color={tokens.color.forest} strokeWidth={2} />
                <Text style={styles.pillText}>
                  {profile.reviews.avgRating} · {profile.reviews.count}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  appbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6 },
  back: { fontSize: 22, color: tokens.color.ink },
  content: { padding: 16, gap: 10 },

  hero: { alignItems: 'center', gap: 4 },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: tokens.color.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 92, height: 92, borderRadius: 46 },
  avatarInitial: { fontFamily: fonts.displaySemi, fontSize: 38, color: tokens.color.cream },
  verified: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: tokens.color.forest,
    borderColor: tokens.color.cream,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: fonts.display, fontSize: 24, color: tokens.color.ink, marginTop: 8 },
  tier: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: tokens.color.coralInk },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 6 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: tokens.color.bg2,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: tokens.color.text2 },
  keepClose: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: tokens.color.forest,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 11,
    marginTop: 12,
  },
  keepCloseText: { fontFamily: fonts.bodySemi, fontSize: 14, color: tokens.color.cream },

  sectionTitle: {
    fontFamily: fonts.displaySemi,
    fontSize: 15,
    color: tokens.color.ink,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  bio: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: tokens.color.text2 },
  events: { gap: 10 },

  repCard: {
    backgroundColor: tokens.color.forestSoft,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  repTier: { fontFamily: fonts.displaySemi, fontSize: 17, color: tokens.color.forest },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: tokens.color.cream,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: tokens.color.ink },
  notice: {
    alignSelf: 'center',
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    color: tokens.color.ink,
    backgroundColor: tokens.color.goldGlow,
    borderColor: tokens.color.goldBorder,
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 12,
  },
});
