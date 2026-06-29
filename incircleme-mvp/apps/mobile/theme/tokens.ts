// Brand tokens — source of truth: IncircleMe-v3 prototype + Engineering Handoff.
// cream/coral/forest/gold + Fraunces (display) / Inter (body). This is the brand the
// Vite app lacked; every screen reads from here so the voice/visual stays locked.
export const tokens = {
  color: {
    cream: '#F7F3ED',
    bg2: '#FFFFFF',
    coral: '#D4825A',
    coralSoft: '#E8A585',
    coralInk: '#A6563A',
    forest: '#2E4531',
    forestSoft: '#E4EAE1',
    gold: '#E5B73D',
    goldGlow: 'rgba(229,183,61,0.12)',
    goldBorder: 'rgba(229,183,61,0.30)',
    goldLine: 'rgba(229,183,61,0.32)',
    // AA-legible gold for status-chip text/border — decorative `gold` (#E5B73D)
    // is only 1.88:1 on white. 5.65:1 on white, 5.11:1 on cream.
    goldDeep: '#7E6410',
    ink: '#1C1C1E',
    text2: '#6B6762',
    // RULE: `gray` never carries meaningful text — it fails AA on cream (~2.4:1). Use it only
    // for decorative icons, borders, and disabled surfaces. Text → text2 (secondary) or
    // forest (emphasis/warning); placeholder hint text → text2.
    gray: '#A09B92',
    border: '#E5DFD6',
  },
  font: {
    display: 'Fraunces',
    body: 'Inter',
  },
} as const;
