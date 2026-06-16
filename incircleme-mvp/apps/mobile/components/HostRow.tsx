import { Image, StyleSheet, Text, View } from 'react-native';
import type { HostSummary } from '@incircleme/types';
import { tierLabel } from '../lib/trustTier';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

export function HostRow({ host }: { host: HostSummary }) {
  const initial = (host.displayName ?? '?').charAt(0).toUpperCase();
  return (
    <View style={styles.row}>
      {host.avatarUrl ? (
        <Image source={{ uri: host.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{host.displayName ?? 'Amfitrió'}</Text>
        <Text style={styles.tier}>{tierLabel(host.trustTier)}</Text>
        {host.bio ? (
          <Text style={styles.bio} numberOfLines={2}>
            {host.bio}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: tokens.color.forestSoft,
    borderRadius: 14,
    padding: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: tokens.color.border },
  avatarFallback: {
    backgroundColor: tokens.color.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontFamily: fonts.displaySemi, fontSize: 20, color: tokens.color.cream },
  info: { flex: 1, gap: 1 },
  name: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: tokens.color.ink },
  tier: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: tokens.color.coralInk },
  bio: { fontFamily: fonts.body, fontSize: 12, color: tokens.color.text2, marginTop: 2 },
});
