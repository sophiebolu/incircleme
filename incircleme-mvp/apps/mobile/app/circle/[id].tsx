import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import type { ArrivingMoment, CircleDetail, CircleMessage } from '@incircleme/types';
import { t, interpolate } from '@incircleme/i18n';
import { api } from '../../lib/api';
import { joinCircle } from '../../lib/socket';
import { BrandBar } from '../../components/BrandBar';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
const HOUR = 3600_000;
const DAY = 24 * HOUR;

type ArrivingWindow = 'before' | 'after' | null;

function arrivingWindow(startsAt: string, endsAt: string, now: number): ArrivingWindow {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (now >= start - 6 * HOUR && now < start) return 'before';
  if (now >= end && now < end + 48 * HOUR) return 'after';
  return null;
}

function voteWindowOpen(endsAt: string, now: number): boolean {
  const end = new Date(endsAt).getTime();
  return now >= end + 2 * DAY && now < end + 7 * DAY;
}

export default function CircleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [circle, setCircle] = useState<CircleDetail | null>(null);
  const [messages, setMessages] = useState<CircleMessage[]>([]);
  const [moments, setMoments] = useState<ArrivingMoment[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [me, setMe] = useState<string | null>(null);
  const [voteState, setVoteState] = useState<{ yes: number; mine: boolean | null }>({
    yes: 0,
    mine: null,
  });
  const [arrivingDismissed, setArrivingDismissed] = useState(false);
  const [hasCapsule, setHasCapsule] = useState(false);
  const listRef = useRef<FlatList<CircleMessage>>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [detail, profile] = await Promise.all([api.getCircle(id), api.me()]);
      setCircle(detail);
      setMessages(detail.recentMessages);
      setVoteState({ yes: detail.keepYesCount, mine: detail.myKeepVote });
      setMe(profile.id);
      api.listArriving(detail.event.id).then(setMoments).catch(() => {});
      api
        .getCapsule(id)
        .then(() => setHasCapsule(true))
        .catch(() => setHasCapsule(false));
    } catch {
      setCircle(null);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // realtime: join the room, append incoming messages
  useEffect(() => {
    if (!id) return;
    let cleanup: (() => void) | undefined;
    joinCircle(id, ({ message }) => {
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    }).then((fn) => {
      cleanup = fn;
    });
    return () => cleanup?.();
  }, [id]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !id || sending) return; // in-flight guard — double-tap posts once
    setSending(true);
    setDraft('');
    try {
      const msg = await api.postCircleMessage(id, body);
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      listRef.current?.scrollToEnd({ animated: true });
    } catch {
      setDraft(body); // restore on failure
    } finally {
      setSending(false);
    }
  };

  const addArrivingPhoto = async (state: 'before' | 'after') => {
    if (!circle) return;
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    const uri = picked.assets?.[0]?.uri;
    if (!uri) return;
    try {
      const moment = await api.uploadArriving(circle.event.id, state, uri);
      setMoments((prev) => [...prev.filter((m) => m.id !== moment.id), moment]);
    } catch {
      // quiet failure; user can retry
    }
  };

  const castVote = async (vote: boolean) => {
    if (!id) return;
    try {
      const res = await api.keepVote(id, vote);
      setVoteState({ yes: res.keepYesCount, mine: vote });
      if (res.kept) void load();
    } catch {
      // ignore
    }
  };

  if (!circle) {
    return <SafeAreaView style={styles.safe} />;
  }

  const now = Date.now();
  const startMs = new Date(circle.event.startsAt).getTime();
  const unlockMs = startMs - DAY;
  const hoursToUnlock = Math.max(0, Math.ceil((unlockMs - now) / HOUR));
  const kept = circle.keptAt !== null;
  const window = arrivingWindow(circle.event.startsAt, circle.event.endsAt, now);
  const showVote = !kept && voteWindowOpen(circle.event.endsAt, now);
  const eventDateLine = new Date(circle.event.startsAt).toLocaleString('ca-ES', {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  const members = Object.fromEntries(circle.members.map((m) => [m.userId, m]));

  const renderMessage = ({ item }: { item: CircleMessage }) => {
    const sender = members[item.userId];
    const isSelf = item.userId === me;
    const isHost = sender?.role === 'host';
    return (
      <View style={[styles.bubbleRow, isSelf && styles.bubbleRowSelf]}>
        <View
          style={[
            styles.bubble,
            isSelf || isHost ? styles.bubbleForest : styles.bubbleWhite,
          ]}
        >
          {!isSelf ? (
            <View style={styles.senderRow}>
              <Text style={[styles.sender, isHost ? styles.senderHost : styles.senderOther]}>
                {sender?.displayName ?? '—'}
              </Text>
              {isHost ? <Text style={styles.hostTag}>HOST</Text> : null}
            </View>
          ) : null}
          <Text style={isSelf || isHost ? styles.bodyOnForest : styles.bodyOnWhite}>
            {item.body}
          </Text>
          {item.attachments?.map((a) => (
            <Image
              key={a.url}
              source={{ uri: a.url.startsWith('http') ? a.url : `${API_BASE}${a.url}` }}
              style={styles.attachment}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <BrandBar />
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.back}>←</Text>
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {circle.event.title}
            </Text>
            <Text style={styles.headerMeta} numberOfLines={1}>
              {interpolate(t('membersLine'), {
                circle: t('circle'),
                count: String(circle.members.length),
                barri: circle.event.neighbourhood ?? 'Barcelona',
              })}
            </Text>
          </View>
        </View>

        {/* Countdown / kept banner (prototype .circle-bar) */}
        {kept ? (
          <View style={[styles.bar, styles.barKept]}>
            <View style={styles.barBody}>
              {/* §20 locked: "Kept by the group · since {date}" (§6 'Circle kept' = badges only) */}
              <Text style={styles.barTitleKept}>
                {interpolate(t('keptByGroup'), {
                  date: new Date(circle.keptAt!).toLocaleDateString('ca-ES', {
                    day: 'numeric',
                    month: 'short',
                  }),
                })}
              </Text>
              <Text style={styles.barSub}>{t('keptNote')}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.bar}>
            <View style={styles.barBody}>
              <Text style={styles.barTitle}>
                {circle.event.addressLocked ? (
                  <>
                    {t('addressUnlocksPrefix')}
                    <Text style={styles.barEm}>{t('addressUnlocksEm')}</Text>
                  </>
                ) : (
                  (circle.event.address ?? '')
                )}
              </Text>
              <Text style={styles.barSub}>
                {eventDateLine} · {circle.event.neighbourhood ?? 'Barcelona'}
              </Text>
            </View>
            {circle.event.addressLocked && hoursToUnlock > 0 ? (
              <Text style={styles.barHours}>{hoursToUnlock}h</Text>
            ) : null}
          </View>
        )}

        {/* Capsule-ready banner (§21 + §6 locked) */}
        {hasCapsule ? (
          <Pressable
            style={[styles.bar, styles.barKept]}
            onPress={() => router.push(`/capsule/${id}`)}
            accessibilityRole="button"
          >
            <View style={styles.barBody}>
              <Text style={styles.barTitleKept}>{t('capsuleReady')}</Text>
              <Text style={styles.barSub}>{t('openCapsule')} →</Text>
            </View>
          </Pressable>
        ) : null}

        {/* Arriving prompt card (T-6h / T..+48h windows, §10b locked titles) */}
        {window && !arrivingDismissed ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {window === 'before' ? t('arrivingBefore') : t('arrivingAfter')}
            </Text>
            {window === 'before' ? (
              <Text style={styles.cardEyebrow}>
                {interpolate(t('roomOpensIn'), {
                  hours: String(Math.max(1, Math.ceil((startMs - now) / HOUR))),
                })}
              </Text>
            ) : null}
            <Text style={styles.cardSub}>{t('arrivingHelper')}</Text>
            {moments.length > 0 ? (
              <View style={styles.momentsRow}>
                {moments.slice(0, 5).map((m) => (
                  <Image
                    key={m.id}
                    source={{
                      uri: m.photoUrl.startsWith('http')
                        ? m.photoUrl
                        : `${API_BASE}${m.photoUrl}`,
                    }}
                    style={styles.momentThumb}
                  />
                ))}
              </View>
            ) : null}
            <View style={styles.cardActions}>
              <Pressable style={styles.cardCta} onPress={() => addArrivingPhoto(window)}>
                <Text style={styles.cardCtaText}>{t('addYours')}</Text>
              </Pressable>
              <Pressable onPress={() => setArrivingDismissed(true)} hitSlop={8}>
                <Text style={styles.cardSkip}>{t('skipForNow')}</Text>
              </Pressable>
            </View>
            <Text style={styles.cardNote}>{t('arrivingFade')}</Text>
          </View>
        ) : null}

        {/* Afterlife vote card (D+2 → D+7) */}
        {showVote ? (
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>{t('afterlifeEyebrow').toUpperCase()}</Text>
            <Text style={styles.cardTitle}>
              {t('keepThisCircle')} <Text style={styles.cardTitleEm}>{t('keepGoingEm')}</Text>
            </Text>
            <Text style={styles.cardSub}>
              {interpolate(t('votesProgress'), {
                yes: String(voteState.yes),
                total: String(circle.members.length),
              })}
            </Text>
            {voteState.mine === null ? (
              <View style={styles.cardActions}>
                <Pressable style={styles.cardCta} onPress={() => castVote(true)}>
                  <Text style={styles.cardCtaText}>{t('voteYes')}</Text>
                </Pressable>
                <Pressable style={styles.cardGhost} onPress={() => castVote(false)}>
                  <Text style={styles.cardGhostText}>{t('voteNo')}</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.cardNote}>{t('votedWaiting')}</Text>
            )}
          </View>
        ) : null}

        {/* In-chat system line while the address is still locked (§20) */}
        {!kept && circle.event.addressLocked ? (
          <Text style={styles.systemLine}>{t('addressUnlockedNote')}</Text>
        ) : null}

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Composer */}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder={t('composerPlaceholder')}
            placeholderTextColor={tokens.color.gray}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable
            style={[styles.send, sending && styles.sendDisabled]}
            onPress={send}
            disabled={sending}
            accessibilityRole="button"
          >
            <Text style={styles.sendText}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  back: { fontSize: 22, color: tokens.color.ink },
  headerInfo: { flex: 1 },
  headerTitle: { fontFamily: fonts.displaySemi, fontSize: 17, color: tokens.color.ink },
  headerMeta: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.gray },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: tokens.color.forestSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  barKept: { backgroundColor: tokens.color.goldGlow },
  barBody: { flex: 1, gap: 1 },
  barTitle: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.ink },
  barTitleKept: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.forest },
  barEm: { fontFamily: fonts.displayItalic, color: tokens.color.coralInk },
  barSub: { fontFamily: fonts.body, fontSize: 11.5, color: tokens.color.gray },
  barHours: {
    fontFamily: fonts.displaySemi,
    fontSize: 15,
    color: tokens.color.forest,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  cardEyebrow: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 9.5,
    letterSpacing: 1.1,
    color: tokens.color.coralInk,
  },
  cardTitle: { fontFamily: fonts.display, fontSize: 18, color: tokens.color.ink },
  cardTitleEm: { fontFamily: fonts.displayItalic, color: tokens.color.coralInk },
  cardSub: { fontFamily: fonts.body, fontSize: 12.5, color: tokens.color.text2 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  cardCta: {
    backgroundColor: tokens.color.forest,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  cardCtaText: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.cream },
  cardGhost: {
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  cardGhostText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: tokens.color.ink },
  cardSkip: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: tokens.color.gray },
  cardNote: { fontFamily: fonts.body, fontSize: 11, color: tokens.color.gray },
  momentsRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  momentThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: tokens.color.border,
  },
  messages: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowSelf: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleWhite: {
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
  },
  bubbleForest: { backgroundColor: tokens.color.forest },
  senderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  sender: { fontFamily: fonts.bodySemi, fontSize: 11.5 },
  senderHost: { color: tokens.color.coralSoft },
  senderOther: { color: tokens.color.forest },
  hostTag: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 8,
    letterSpacing: 0.8,
    color: tokens.color.coral,
  },
  bodyOnForest: { fontFamily: fonts.body, fontSize: 14, color: tokens.color.cream },
  bodyOnWhite: { fontFamily: fonts.body, fontSize: 14, color: tokens.color.ink },
  attachment: { width: 180, height: 130, borderRadius: 10, marginTop: 6 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopColor: tokens.color.border,
    borderTopWidth: 1,
    backgroundColor: tokens.color.cream,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontFamily: fonts.body,
    fontSize: 14,
    color: tokens.color.ink,
  },
  send: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: tokens.color.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.45 },
  sendText: { color: tokens.color.cream, fontSize: 17 },
  systemLine: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: tokens.color.gray,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
});
