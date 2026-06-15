import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../lib/api';
import { saveSession } from '../lib/auth';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

// DEV-ONLY quick sign-in. In a production build __DEV__ is false → this renders
// nothing and the backing /dev/login route isn't registered either.
// Usage: /dev-login?next=/programs/<id>&email=<host>
export default function DevLogin() {
  const router = useRouter();
  const { next, email } = useLocalSearchParams<{ next?: string; email?: string }>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!__DEV__) {
      router.replace('/');
      return;
    }
    (async () => {
      try {
        const session = await api.devLogin(typeof email === 'string' ? email : undefined);
        await saveSession(session);
        router.replace((typeof next === 'string' && next) || '/programs');
      } catch {
        setFailed(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!__DEV__) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.text}>{failed ? 'dev login failed — is the API running?' : '…'}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fonts.body, fontSize: 14, color: tokens.color.text2 },
});
