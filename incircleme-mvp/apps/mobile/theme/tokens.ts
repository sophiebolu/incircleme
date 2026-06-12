// Brand tokens — source of truth: IncircleMe-v3 prototype + Engineering Handoff.
// cream/coral/forest/gold + Fraunces (display) / Inter (body). This is the brand the
// Vite app lacked; every screen reads from here so the voice/visual stays locked.
export const tokens = {
  color: {
    cream: '#F7F3ED',
    coral: '#D4825A',
    coralSoft: '#E8A585',
    coralInk: '#A6563A',
    forest: '#2E4531',
    forestSoft: '#E4EAE1',
    gold: '#E5B73D',
    ink: '#1C1C1E',
    gray: '#A09B92',
    border: '#E5DFD6',
  },
  font: {
    display: 'Fraunces',
    body: 'Inter',
  },
} as const;
