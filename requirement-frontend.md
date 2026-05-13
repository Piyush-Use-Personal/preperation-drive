# Design system and UX rules — mobile-first exam + drive app

Companion to `requirement.md`. Implemented in this repo with Next.js, Tailwind, and the patterns below.

---

## Core design principles

1. **Clarity over creativity** — During an exam the user should not have to guess; every action should feel obvious.
2. **One primary action per screen** — Avoid competing CTAs.
3. **Reduce cognitive load** — Chunk information; show only what is needed.
4. **Fast interactions** — Immediate feedback on tap; avoid perceived lag.

---

## Mobile-first layout

- Max width: `480px` for main content
- Padding: `16px`
- Single column; avoid side-by-side inputs unless necessary

---

## Visual style

### Colors

- Primary: indigo / blue
- Success: green
- Error: red
- Warning: orange
- Background: `#F7F7F7`
- Cards: white

### Typography

- Font: Inter / system UI
- Title: 18–20px; subtitle: 14–16px; body: 14px; caption: 12px
- Headings: medium; body: regular

### Spacing

Scale: `4px, 8px, 12px, 16px, 20px, 24px`

---

## Core components

### Cards

Files, folders, questions: border radius `12px`, padding `12–16px`, subtle shadow.

### Buttons

- Primary: filled, full width on mobile, height 44–48px
- Secondary: outline or ghost

### Inputs

Large touch targets, clear focus state, inline validation.

---

## Exam taking (critical)

**Golden rule:** The user should not lose progress or feel anxious.

### Question layout

- Question number, text, inputs, subtle auto-save indicator.

### Navigation

- Start with **vertical scroll** through all questions.

---

## Auto-save (mandatory)

- Save on option change; debounce text input (~500ms).
- Local state updates immediately; backend save is async.
- Indicators: “Saving…”, then “Saved ✓”.
- Do not block the UI on save; restore answers after reload.

---

## Submission UX

- Confirm before submit: “Are you sure you want to submit?”
- After submit: loader, then result screen.

---

## Result UX

- Large score; status: evaluated vs pending review.

---

## Manual evaluation (owner)

For text answers: show answer, marks input, correct/incorrect control.

---

## Drive UX

- Simple back button or breadcrumb.
- Empty states with copy + CTA (e.g. “Create file”).

---

## Sharing UX

- Modal with email field and add action.

---

## Locked file UX

- “Locked” badge; disable editing; offer “Clone & edit”.

---

## Navigation

Bottom tab bar: Home, Drive, Shared, Profile.

---

## State feedback

Loading skeletons, empty states, clear errors.

---

## Accessibility (basic)

- Tap targets ≥ 44px
- Sufficient contrast
- Labels for inputs

---

## UX success criteria

- Tests can be taken without confusion.
- No data loss; responsive feel; low learning curve.

---

## Emphasis

If you prioritize one thing: **auto-save and restore should feel invisible and reliable.**
