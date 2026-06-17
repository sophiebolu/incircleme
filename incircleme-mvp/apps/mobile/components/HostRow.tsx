import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, ChevronRight } from 'lucide-react-native';
import type { HostSummary } from '@incircleme/types';
import { interpolate, t } from '@incircleme/i18n';
import { tierLabel } from '../lib/trustTier';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

export function HostRow({ host, onPress }: { host: HostSummary; onPress?: () => void }) {
  const initial = (host.displayName ?? '?').charAt(0).toUpperCase();
  const Container = onPress ? Pressable : View;
  return (
    <Container
      style={styles.row}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.avatarWrap}>
        {host.avatarUrl ? (
          <Image source={{ uri: host.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        {host.verified ? (
          <View style={styles.verified} accessibilityLabel={t('prof_verified')}>
            <Check size={11} color={tokens.color.cream} strokeWidth={3} />
          </View>
        ) : null}
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{host.displayName ?? 'Amfitrió'}</Text>
        <Text style={styles.tier}>{tierLabel(host.trustTier)}</Text>
        {host.eventsHosted > 0 ? (
          <Text style={styles.stat}>
            {interpolate(t('ev_eventsHosted'), { n: String(host.eventsHosted) })}
          </Text>
        ) : host.bio ? (
          <Text style={styles.bio} numberOfLines={2}>
            {host.bio}
          </Text>
        ) : null}
      </View>
      {onPress ? <ChevronRight size={18} color={tokens.color.gray} strokeWidth={2} /> : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: tokens.color.forestSoft,
    borderRadius: 14,
    padding: 12,
  },
  avatarWrap: { width: 48, height: 48 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: tokens.color.border },
  avatarFallback: {
    backgroundColor: tokens.color.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontFamily: fonts.displaySemi, fontSize: 20, color: tokens.color.cream },
  verified: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: tokens.color.forest,
    borderColor: tokens.color.forestSoft,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 1 },
  name: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: tokens.color.ink },
  tier: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: tokens.color.coralInk },
  stat: { fontFamily: fonts.body, fontSize: 12, color: tokens.color.text2, marginTop: 2 },
  bio: { fontFamily: fonts.body, fontSize: 12, color: tokens.color.text2, marginTop: 2 },
});
