import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import type { CircleSummary } from '@incircleme/types';
import { t, interpolate } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { isSignedIn } from '../../lib/auth';
import { BrandBar } from '../../components/BrandBar';
import { useNavClearance } from '../../lib/useNavClearance';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

export default function Chats() {
  const router = useRouter();
  const [circles, setCircles] = useState<CircleSummary[] | null>(null);
  const [signedIn, setSignedIn] = useState(true);
  const navClearance = useNavClearance();

  useFocusEffect(
    useCallback(() => {
      let live = true;
      void (async () => {
        if (!(await isSignedIn())) {
          if (live) setSignedIn(false);
          return;
        }
        try {
          const data = await api.myCircles();
          if (live) {
            setSignedIn(true);
            setCircles(data);
          }
        } catch {
          if (live) setCircles([]);
        }
      })();
      return () => {
        live = false;
      };
    }, []),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <Text style={styles.heading}>{t('chats')}</Text>
      {!signedIn ? (
        <Text style={styles.empty}>
          {t('signIn')} — {t('profile')}
        </Text>
      ) : (
        <FlatList
          data={circles ?? []}
          keyExtractor={(c) => c.id}
          contentContainerStyle={[styles.list, { paddingBottom: navClearance }]}
          ListEmptyComponent={<Text style={styles.empty}>—</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/circle/${item.id}`)}
              accessibilityRole="button"
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.eventTitle.charAt(0)}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.eventTitle}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {interpolate(t('membersLine'), {
                    circle: t('circle'),
                    count: String(item.memberCount),
                    barri: 'Gràcia',
                  })}
                </Text>
              </View>
              <View style={styles.badges}>
                {item.keptAt ? <Text style={styles.kept}>{t('circleKept')}</Text> : null}
                {item.hasCapsule ? <Text style={styles.capsule}>{t('memoryCapsule')}</Text> : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  heading: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: tokens.color.ink,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: tokens.color.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displaySemi, fontSize: 18, color: tokens.color.cream },
  info: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: tokens.color.ink },
  meta: { fontFamily: fonts.body, fontSize: 12, color: tokens.color.text2 },
  badges: { alignItems: 'flex-end', gap: 2 },
  kept: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: tokens.color.forest },
  capsule: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: tokens.color.coralInk },
  empty: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: tokens.color.text2,
    paddingHorizontal: 16,
  },
});
