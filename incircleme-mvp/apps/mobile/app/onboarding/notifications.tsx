import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { t } from '@incircleme/i18n';
import type { StringKey } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import { OnbBadge, OnbButton, OnbScaffold, OnbSub, OnbTitle, OnbToggle } from '../../components/Onb';
import { resetOnbDraft } from '../../lib/onboarding';

export default function Notifications() {
  const router = useRouter();
  const [circles, setCircles] = useState(true);
  const [nearby, setNearby] = useState(true);
  const [busy, setBusy] = useState(false);

  async function finish(prefs: { circles: boolean; nearby: boolean }) {
    setBusy(true);
    try {
      // Final step → persist consent + flip the completed flag so returning users skip onboarding.
      await api.updateMe({ notificationPrefs: prefs, onboardingCompleted: true });
      resetOnbDraft();
      router.replace('/(tabs)');
    } finally {
      setBusy(false);
    }
  }

  return (
    <OnbScaffold
      step={4}
      footer={
        <View style={styles.footerCol}>
          <OnbButton label={t('onb_notif_cta')} onPress={() => finish({ circles, nearby })} disabled={busy} />
          <Pressable
            onPress={() => finish({ circles: false, nearby: false })}
            disabled={busy}
            accessibilityRole="button"
            style={styles.minimalWrap}
          >
            <Text style={styles.minimal}>{t('onb_notif_minimal')}</Text>
          </Pressable>
        </View>
      }
    >
      <OnbTitle>{t('onb_notif_title')}</OnbTitle>
      <OnbSub>{t('onb_notif_sub')}</OnbSub>

      <Row title="onb_notif_bookings" sub="onb_notif_bookings_sub" locked />
      <Row title="onb_notif_circles" sub="onb_notif_circles_sub" value={circles} onChange={setCircles} />
      <Row title="onb_notif_nearby" sub="onb_notif_nearby_sub" value={nearby} onChange={setNearby} />

      <Text style={styles.promise}>{t('onb_notif_sub')}</Text>
      <Text style={styles.settings}>{t('onb_notif_settings')}</Text>
    </OnbScaffold>
  );
}

function Row({
  title,
  sub,
  value,
  onChange,
  locked,
}: {
  title: StringKey;
  sub: StringKey;
  value?: boolean;
  onChange?: (v: boolean) => void;
  locked?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <View style={styles.rowTitleLine}>
          <Text style={styles.rowTitle}>{t(title)}</Text>
          {locked ? <OnbBadge label={t('onb_notif_bookings_always')} /> : null}
        </View>
        <Text style={styles.rowSub}>{t(sub)}</Text>
      </View>
      {/* Custom OnbToggle (pure Views) → ONE "on" colour = forest on every platform.
          Locked bookings = forest on-state, non-pressable (Always-on). */}
      {locked ? (
        <OnbToggle value disabled label={t(title)} />
      ) : (
        <OnbToggle value={!!value} onChange={onChange} label={t(title)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.bg2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  rowText: { flex: 1 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { fontFamily: fonts.bodySemi, fontSize: 15, color: tokens.color.ink },
  rowSub: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: tokens.color.text2, marginTop: 4 },
  promise: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 19, color: tokens.color.forest, marginTop: 8 },
  settings: { fontFamily: fonts.body, fontSize: 12, color: tokens.color.text2, marginTop: 8 },
  footerCol: { gap: 12 },
  minimalWrap: { alignItems: 'center' },
  minimal: { fontFamily: fonts.bodyMedium, fontSize: 13, color: tokens.color.text2 },
});
