import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/fonts';

// Presentational stub until Slice 5 (Programs backend). Cards mirror the prototype strip.
const STUB_PROGRAMS = [
  {
    title: 'Hands in Clay',
    host: 'Teresa',
    weeks: 6,
    photo: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600',
  },
  {
    title: 'Drawing from Life',
    host: 'Sofía',
    weeks: 8,
    photo: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600',
  },
  {
    title: 'Catalan for Newcomers',
    host: 'Joan',
    weeks: 6,
    photo: 'https://images.unsplash.com/photo-1543165796-5426273eaab3?w=600',
  },
];

export function ProgramsStrip() {
  return (
    <View>
      {/* Locked verbatim (Codex-Brief): EN-only until CA/ES rows are locked */}
      <Text style={styles.eyebrow}>Programs. Where craft becomes your way.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {STUB_PROGRAMS.map((p) => (
          <View key={p.title} style={styles.card}>
            <Image source={{ uri: p.photo }} style={styles.photo} />
            <Text style={styles.title} numberOfLines={1}>
              {p.title}
            </Text>
            <Text style={styles.meta}>
              {p.host} · {p.weeks} setmanes
            </Text>
          </View>
        ))}
      </ScrollView>
      {/* Locked verbatim (Codex-Brief) */}
      <Text style={styles.trust}>Verified by IncircleMe Trust · the certificate is real.</Text>
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
    backgroundColor: tokens.color.border,
    marginBottom: 6,
  },
  title: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.ink },
  meta: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.gray },
  trust: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: tokens.color.gray,
    marginTop: 10,
  },
});
