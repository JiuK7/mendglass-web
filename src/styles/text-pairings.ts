// Which text colour may sit on which background.
//
// A pair that is not listed here is not allowed. Every listed pair is
// checked at 4.5:1 or more by tokens.test.ts (WCAG 2.2 AA for normal text).
// To use a new pair, add it here first; the test then checks it.
//
// | Background       | Allowed text                  | Notes                          |
// | ---------------- | ----------------------------- | ------------------------------ |
// | mineral          | carbon, neutral-dark, neutral | the default canvas             |
// | neutral-lightest | carbon, neutral-dark, neutral | light surfaces                 |
// | warm-stone       | carbon, neutral-dark          | not neutral (3.58:1)           |
// | mist             | carbon                        | not neutral (2.76:1) or        |
// |                  |                               | neutral-dark (4.31:1)          |
// | carbon           | mineral                       | dark sections, primary button  |
// | deep-mineral     | mineral                       | alternate dark sections        |
// | neutral-darker   | mineral                       | primary button on hover        |
//
// Muted text (neutral, neutral-dark) follows Brand System section 7. It is
// allowed only where it passes, which rules it out on Mist completely and
// rules out `neutral` on Warm Stone.
export const textPairings = {
  mineral: ["carbon", "neutral-dark", "neutral"],
  "neutral-lightest": ["carbon", "neutral-dark", "neutral"],
  "warm-stone": ["carbon", "neutral-dark"],
  mist: ["carbon"],
  carbon: ["mineral"],
  "deep-mineral": ["mineral"],
  "neutral-darker": ["mineral"],
} as const satisfies Record<string, readonly string[]>;
