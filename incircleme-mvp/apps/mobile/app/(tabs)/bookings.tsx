import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import type { BookingListItem } from '@incircleme/types';
import { t } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { isSignedIn } from '../../lib/auth';
import { EventCard } from '../../components/EventCard';
import { BrandBar } from '../../components/BrandBar';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

const statusLabel = (s: string): string => {
  switch (s) {
    case 'held':
      return t('bookStatusHeld');
    case 'confirmed':
      return t('bookStatusConfirmed');
    case 'cancelled':
      return t('bookStatusCancelled');
    case 'refunded':
      return t('bookStatusRefunded');
    default:
      return s;
  }
};

export default function Bookings() {
  const [items, setItems] = useState<BookingListItem[] | null>(null);
  const [signedIn, setSignedIn] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      void (async () => {
        if (!(await isSignedIn())) {
          if (live) setSignedIn(false);
          return;
        }
        try {
          const data = await api.myBookings();
          if (live) {
            setSignedIn(true);
            setItems(data);
          }
        } catch {
          if (live) setItems([]);
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
      <Text style={styles.heading}>{t('bookings')}</Text>
      {!signedIn ? (
        <Text style={styles.empty}>
          {t('signIn')} — {t('profile')}
        </Text>
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>—</Text>}
          renderItem={({ item }) => (
            <View>
              <Text style={[styles.status, item.status === 'confirmed' && styles.statusOk]}>
                {statusLabel(item.status)}
              </Text>
              <EventCard event={item.event} />
            </View>
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
  status: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: tokens.color.text2,
    marginBottom: 4,
  },
  statusOk: { color: tokens.color.forest },
  empty: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: tokens.color.text2,
    paddingHorizontal: 16,
  },
});
