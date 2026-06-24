import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { t } from '@incircleme/i18n';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import { OnbButton, OnbHeader } from '../../components/Onb';

export default function Welcome() {
  const router = useRouter();
  const toSignIn = () => router.push('/onboarding/sign-in');
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Same steady, centred wordmark as every other onboarding step (no back here). */}
      <OnbHeader showBack={false} />
      <View style={styles.body}>
        <Text style={styles.greeting}>
          {t('onb_welcome_greeting')} <Text style={styles.greetingTag}>{t('onb_welcome_greetingTag')}</Text>
        </Text>
        <Text style={styles.kicker}>{t('onb_welcome_kicker')}</Text>
        <Text style={styles.title}>
          {t('onb_welcome_titleA')}
          {'\n'}
          <Text style={styles.titleEm}>{t('onb_welcome_titleB')}</Text>
        </Text>
        <Text style={styles.sub}>{t('onb_welcome_sub')}</Text>
      </View>
      <View style={styles.footer}>
        <OnbButton label={t('onb_welcome_begin')} onPress={toSignIn} />
        <Pressable onPress={toSignIn} accessibilityRole="button" style={styles.signinWrap}>
          <Text style={styles.signin}>{t('onb_welcome_signin')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  greeting: { fontFamily: fonts.displayItalic, fontSize: 22, color: tokens.color.coralInk, marginBottom: 16 },
  greetingTag: { fontFamily: fonts.body, fontSize: 13, color: tokens.color.text2 },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: tokens.color.text2,
    marginBottom: 10,
  },
  title: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46, color: tokens.color.ink },
  titleEm: { fontFamily: fonts.displayItalic, color: tokens.color.coralInk },
  sub: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: tokens.color.text2, marginTop: 16 },
  footer: { paddingHorizontal: 28, paddingBottom: 20, gap: 14 },
  signinWrap: { alignItems: 'center' },
  signin: { fontFamily: fonts.bodyMedium, fontSize: 14, color: tokens.color.forest },
});
