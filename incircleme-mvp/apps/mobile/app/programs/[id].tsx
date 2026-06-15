import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import type {
  CredentialKind,
  MeResponse,
  Program,
  ProgramCredentialDTO,
  UpdateProgramRequest,
} from '@incircleme/types';
import { t } from '@incircleme/i18n';
import { api, ApiError } from '../../lib/api';
import { isSignedIn } from '../../lib/auth';
import { presentPayment } from '../../lib/stripePay';
import { isEditable, statusColor, statusLabel } from '../../lib/programStatus';
import { BrandBar } from '../../components/BrandBar';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

const KIND_KEY = {
  diploma: 'prog_kindDiploma',
  license: 'prog_kindLicense',
  accreditation: 'prog_kindAccreditation',
  reference_letter: 'prog_kindReferenceLetter',
} as const;
const KINDS = Object.keys(KIND_KEY) as CredentialKind[];

const STEPS = [
  'prog_secBasics',
  'prog_secCurriculum',
  'prog_secAccreditation',
  'prog_secReferences',
  'prog_secCredentials',
  'prog_secReviewSubmit',
] as const;

type Phase =
  | 'loading'
  | 'editing'
  | 'readonly'
  | 'submitting'
  | 'paying'
  | 'done'
  | 'premiumBlocked'
  | 'signedOut'
  | 'error';

const num = (s: string): number | undefined => {
  const n = Number(s);
  return s.trim() && Number.isFinite(n) ? n : undefined;
};

export default function ProgramForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === 'new';

  const [programId, setProgramId] = useState<string | null>(isNew ? null : (id ?? null));
  const [program, setProgram] = useState<Program | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [phase, setPhase] = useState<Phase>(isNew ? 'editing' : 'loading');
  const [step, setStep] = useState(0);
  const [usedFreeCredit, setUsedFreeCredit] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sessions, setSessions] = useState('');
  const [hours, setHours] = useState('');
  const [assess, setAssess] = useState('');
  const [body, setBody] = useState('');
  const [accId, setAccId] = useState('');
  const [weeks, setWeeks] = useState<string[]>([]);
  const [refs, setRefs] = useState<string[]>([]);
  const [credentials, setCredentials] = useState<ProgramCredentialDTO[]>([]);
  const [credKind, setCredKind] = useState<CredentialKind>('diploma');

  const hydrate = (p: Program) => {
    setProgram(p);
    setTitle(p.title);
    setDescription(p.description ?? '');
    setSessions(p.timeFrameSessions != null ? String(p.timeFrameSessions) : '');
    setHours(p.timeFrameTotalHours != null ? String(p.timeFrameTotalHours) : '');
    setAssess(p.assessmentMethod ?? '');
    setBody(p.accreditationBody ?? '');
    setAccId(p.accreditationId ?? '');
    setWeeks(p.curriculum.map((w) => w.title));
    setRefs(p.references.map((r) => r.name));
    setCredentials(p.credentials);
  };

  useEffect(() => {
    (async () => {
      if (!(await isSignedIn())) return setPhase('signedOut');
      try {
        const profile = await api.me();
        setMe(profile);
        if (!isNew && programId) {
          const p = await api.getMyProgram(programId);
          hydrate(p);
          setPhase(isEditable(p.status) ? 'editing' : 'readonly');
        }
      } catch {
        setPhase('error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildPatch = (): UpdateProgramRequest => ({
    ...(title.trim() ? { title: title.trim() } : {}),
    description: description.trim() || undefined,
    timeFrameSessions: num(sessions),
    timeFrameTotalHours: num(hours),
    assessmentMethod: assess.trim() || undefined,
    accreditationBody: body.trim() || undefined,
    accreditationId: accId.trim() || undefined,
    curriculum: weeks
      .map((w, i) => ({ week: i + 1, title: w.trim() }))
      .filter((w) => w.title.length > 0),
    references: refs
      .map((r) => r.trim())
      .filter(Boolean)
      .map((name) => ({ name })),
  });

  // Persist current state; creates the draft on first save (title required by the API).
  const save = async (): Promise<string> => {
    const patch = buildPatch();
    if (programId) {
      const updated = await api.updateProgram(programId, patch);
      setProgram(updated);
      return programId;
    }
    const created = await api.createProgram({ title: title.trim(), ...patch });
    setProgramId(created.id);
    setProgram(created);
    return created.id;
  };

  const advance = async () => {
    try {
      await save();
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    } catch {
      setPhase('error');
    }
  };

  const saveDraftAndExit = async () => {
    try {
      await save();
      router.replace('/programs');
    } catch {
      setPhase('error');
    }
  };

  const addCredential = async () => {
    let pid = programId;
    try {
      if (!pid) pid = await save();
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      const uri = picked.assets?.[0]?.uri;
      if (!uri) return;
      const updated = await api.uploadCredential(pid, credKind, uri);
      setProgram(updated);
      setCredentials(updated.credentials);
    } catch {
      setPhase('error');
    }
  };

  const submit = async () => {
    setPhase('submitting');
    try {
      const pid = await save();
      const result = await api.submitProgram(pid);
      setUsedFreeCredit(result.usedFreeCredit);
      if (result.clientSecret) {
        setPhase('paying');
        const paid = await presentPayment(result.clientSecret, PUBLISHABLE_KEY);
        if (!paid.ok) throw new Error(paid.error);
      }
      setPhase('done');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'not_premium') setPhase('premiumBlocked');
      else setPhase('error');
    }
  };

  const back = () => (step > 0 ? setStep((s) => s - 1) : router.back());

  // --- Terminal / non-editing states ---
  if (phase === 'loading' || phase === 'signedOut' || phase === 'error') {
    return (
      <Shell onBack={() => router.back()}>
        <Text style={styles.note}>
          {phase === 'signedOut' ? t('signIn') : phase === 'error' ? '···' : '…'}
        </Text>
      </Shell>
    );
  }

  if (phase === 'done') {
    return (
      <Shell onBack={() => router.replace('/programs')}>
        <Text style={styles.confirmTitle}>{statusLabel('pending_review')}</Text>
        <Text style={styles.note}>
          {usedFreeCredit ? t('prog_includedPremium') : t('prog_feeExplainer')}
        </Text>
        <Pressable style={styles.cta} onPress={() => router.replace('/programs')}>
          <Text style={styles.ctaText}>{t('prog_entry')}</Text>
        </Pressable>
      </Shell>
    );
  }

  if (phase === 'premiumBlocked') {
    return (
      <Shell onBack={() => router.replace('/programs')}>
        <Text style={styles.note}>{t('prog_premiumOnly')}</Text>
      </Shell>
    );
  }

  if (phase === 'readonly' && program) {
    return (
      <Shell onBack={() => router.back()}>
        <Text style={styles.title}>{program.title}</Text>
        <View style={[styles.chip, { borderColor: statusColor(program.status), alignSelf: 'flex-start' }]}>
          <Text style={[styles.chipText, { color: statusColor(program.status) }]}>
            {statusLabel(program.status)}
          </Text>
        </View>
        {program.status === 'submitted' ? (
          <Text style={styles.note}>{t('prog_feeExplainer')}</Text>
        ) : null}
      </Shell>
    );
  }

  // --- Editing: multi-step form ---
  const isReview = step === STEPS.length - 1;
  const sessionCount = num(sessions) ?? weeks.length;
  const willPayFee = (me?.freeProgramCredits ?? 0) <= 0;
  const canAdvance = step !== 0 || title.trim().length > 0;
  const summaryVal = (s: string) => (s.trim() ? s.trim() : t('prog_valueNone'));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <Pressable onPress={back} hitSlop={10}>
        <Text style={styles.back}>←</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {/* Step dots */}
        <View style={styles.dots}>
          {STEPS.map((s, i) => (
            <View key={s} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
        <Text style={styles.heading}>{t(STEPS[step])}</Text>

        {step === 0 ? (
          <>
            <Field label={t('prog_fldTitle')} value={title} onChangeText={setTitle} />
            <Field
              label={t('prog_fldDescription')}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <Field
              label={t('prog_fldWeeksSessions')}
              value={sessions}
              onChangeText={setSessions}
              keyboardType="number-pad"
            />
            <Field
              label={t('prog_fldTotalHours')}
              value={hours}
              onChangeText={setHours}
              keyboardType="number-pad"
            />
          </>
        ) : step === 1 ? (
          <>
            {sessionCount > 0 ? (
              Array.from({ length: sessionCount }).map((_, i) => (
                <View key={i} style={styles.weekRow}>
                  <Text style={styles.weekNum}>{i + 1}</Text>
                  <TextInput
                    style={styles.weekInput}
                    value={weeks[i] ?? ''}
                    onChangeText={(v) =>
                      setWeeks((prev) => {
                        const next = [...prev];
                        while (next.length <= i) next.push('');
                        next[i] = v;
                        return next;
                      })
                    }
                    placeholderTextColor={tokens.color.gray}
                  />
                </View>
              ))
            ) : (
              <Text style={styles.note}>{t('prog_fldWeeksSessions')}</Text>
            )}
          </>
        ) : step === 2 ? (
          <>
            <Field
              label={t('prog_fldHowYouAssess')}
              value={assess}
              onChangeText={setAssess}
              multiline
            />
            <Field label={t('prog_fldAccreditingBody')} value={body} onChangeText={setBody} />
            <Field label={t('prog_fldYourId')} value={accId} onChangeText={setAccId} />
          </>
        ) : step === 3 ? (
          <>
            {refs.map((r, i) => (
              <TextInput
                key={i}
                style={styles.input}
                value={r}
                onChangeText={(v) =>
                  setRefs((prev) => prev.map((x, idx) => (idx === i ? v : x)))
                }
                placeholderTextColor={tokens.color.gray}
              />
            ))}
            <Pressable style={styles.ghost} onPress={() => setRefs((prev) => [...prev, ''])}>
              <Text style={styles.ghostText}>{t('prog_fldAddReference')}</Text>
            </Pressable>
          </>
        ) : step === 4 ? (
          <>
            {credentials.map((c) => (
              <View key={c.id} style={styles.credRow}>
                <Text style={styles.credKind}>{t(KIND_KEY[c.fileKind])}</Text>
                <Text style={styles.credCheck}>✓</Text>
              </View>
            ))}
            <View style={styles.kindPicker}>
              {KINDS.map((k) => (
                <Pressable
                  key={k}
                  style={[styles.kindChip, credKind === k && styles.kindChipOn]}
                  onPress={() => setCredKind(k)}
                >
                  <Text style={[styles.kindChipText, credKind === k && styles.kindChipTextOn]}>
                    {t(KIND_KEY[k])}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.ghost} onPress={addCredential}>
              <Text style={styles.ghostText}>{t('prog_ctaAddCredential')}</Text>
            </Pressable>
          </>
        ) : (
          /* Review & submit — a quiet confirmation of what's being submitted */
          <>
            <Text style={styles.reviewTitle}>{title}</Text>
            <View style={styles.summary}>
              {(
                [
                  [t('prog_fldWeeksSessions'), summaryVal(sessions)],
                  [t('prog_fldTotalHours'), summaryVal(hours)],
                  [t('prog_secAccreditation'), summaryVal(body)],
                  [t('prog_secCredentials'), String(credentials.length)],
                  [t('prog_secReferences'), String(refs.filter((r) => r.trim()).length)],
                ] as [string, string][]
              ).map(([label, value], i, arr) => (
                <View
                  key={label}
                  style={[styles.summaryRow, i < arr.length - 1 && styles.summaryDivider]}
                >
                  <Text style={styles.summaryLabel}>{label}</Text>
                  <Text style={styles.summaryValue}>{value}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.note}>
              {willPayFee ? t('prog_feeExplainer') : t('prog_includedPremium')}
            </Text>
          </>
        )}

        {/* Footer actions */}
        {isReview ? (
          <Pressable
            style={[styles.cta, phase === 'submitting' && styles.ctaDisabled]}
            disabled={(phase as Phase) === 'submitting'}
            onPress={submit}
          >
            <Text style={styles.ctaText}>
              {willPayFee ? t('prog_ctaPaySubmit') : t('prog_ctaSubmitForReview')}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.cta, !canAdvance && styles.ctaDisabled]}
            disabled={!canAdvance}
            onPress={advance}
          >
            <Text style={styles.ctaText}>{t('continueLabel')}</Text>
          </Pressable>
        )}
        <Pressable style={styles.ghost} onPress={saveDraftAndExit}>
          <Text style={styles.ghostText}>{t('prog_ctaSaveDraft')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Shell({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <Pressable onPress={onBack} hitSlop={10}>
        <Text style={styles.back}>←</Text>
      </Pressable>
      <View style={styles.card}>{children}</View>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  keyboardType?: 'number-pad' | 'default';
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        placeholderTextColor={tokens.color.gray}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.cream },
  back: { fontSize: 22, color: tokens.color.ink, paddingHorizontal: 16, paddingTop: 8 },
  body: { padding: 16, gap: 12 },
  card: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  dots: { flexDirection: 'row', gap: 6, marginBottom: 2 },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: tokens.color.border },
  dotActive: { backgroundColor: tokens.color.forest, width: 18 },
  heading: { fontFamily: fonts.display, fontSize: 22, color: tokens.color.ink },
  fieldGroup: { gap: 6 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: tokens.color.ink },
  input: {
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 14,
    color: tokens.color.ink,
    backgroundColor: '#FFFFFF',
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  weekRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weekNum: {
    fontFamily: fonts.displaySemi,
    fontSize: 14,
    color: tokens.color.coralInk,
    width: 20,
    textAlign: 'center',
  },
  weekInput: {
    flex: 1,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 14,
    color: tokens.color.ink,
  },
  credRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  credKind: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: tokens.color.ink },
  credCheck: { fontFamily: fonts.bodySemi, fontSize: 14, color: tokens.color.forest },
  kindPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kindChip: {
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  kindChipOn: { backgroundColor: tokens.color.forestSoft, borderColor: tokens.color.forest },
  kindChipText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: tokens.color.gray },
  kindChipTextOn: { color: tokens.color.forest },
  reviewTitle: { fontFamily: fonts.display, fontSize: 19, color: tokens.color.ink },
  title: { fontFamily: fonts.display, fontSize: 20, color: tokens.color.ink },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 11.5 },
  cta: {
    backgroundColor: tokens.color.forest,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { fontFamily: fonts.bodySemi, fontSize: 15, color: tokens.color.cream },
  ghost: {
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: tokens.color.ink },
  confirmTitle: { fontFamily: fonts.display, fontSize: 22, color: tokens.color.forest },
  // text2 (not gray): the fee/credit line must clear WCAG AA — gray was 2.5:1 on cream.
  note: { fontFamily: fonts.body, fontSize: 13.5, color: tokens.color.text2 },
  summary: {
    backgroundColor: '#FFFFFF',
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 12,
  },
  summaryDivider: { borderBottomColor: tokens.color.border, borderBottomWidth: 1 },
  summaryLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: tokens.color.text2 },
  summaryValue: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: tokens.color.ink,
    flexShrink: 1,
    textAlign: 'right',
  },
});
