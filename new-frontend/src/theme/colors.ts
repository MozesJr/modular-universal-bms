// Neutral/canvas scale — cool graphite-slate, deliberately desaturated so
// color only ever shows up where it encodes real status (see red/orange/
// green below), never as ambient decoration. grey.dark/darker read lighter
// than "main" (dark = hairline border tone, darker = near-ink text) — kept
// this way instead of a strictly monotonic scale because that's how each
// key is actually consumed (see theme/palette.ts's `neutral` mapping).
export const grey = {
  50: '#F7F9FB', // neutral.lighter — pale canvas tint
  100: '#EEF1F5',
  200: '#E1E6EC',
  300: '#EEF1F5', // neutral.light — muted fill (inputs, subtle backgrounds)
  400: '#9AA5B1',
  500: '#5B6572', // neutral.main — secondary/muted text
  600: '#3A4350',
  700: '#C7CED6', // neutral.dark — hairline border
  800: '#1B2430',
  900: '#1B2430', // neutral.darker — near-ink text
  A100: '#E1E6EC', // table row hairline border
  A200: '#9AA5B1',
  A400: '#EEF1F5',
  A700: '#E1E6EC',
};

// "indigo" is the app's brand/ink scale (name kept from the original admin
// template to avoid renaming every palette.ts reference) — repointed from
// SaaS indigo/violet to an instrumentation-panel ink + deep teal accent.
export const indigo = {
  50: '#E3F2F1', // primary.lighter — pale teal tint
  200: '#4A5568', // text.secondary — slate
  300: '#3FA1A8', // primary.light — mid teal
  500: '#0E7C86', // primary.main — accent teal (interactive + "live" signal)
  600: '#0B1220', // text.primary — ink
  700: '#0A5A61', // primary.dark
  900: '#063B40', // primary.darker
};

// Utility blue, kept distinct from the primary teal accent so it never
// competes as a second "brand" hue.
export const blue = {
  50: '#E1F0FB',
  300: '#6FB2DC',
  500: '#2E86AB',
};

// secondary — demoted to a muted slate-teal rather than a competing accent
// hue, since the design principle is "one interactive color" (see
// AGENTS/design notes for Pack Detail): this exists only so pages that
// haven't been restyled yet (e.g. Dashboard) don't look broken.
export const purple = {
  50: '#E3EAEE',
  300: '#5B7480',
  500: '#3A5A63',
  700: '#0A5A61',
  900: '#063B40',
};

// Status triad — reserved EXCLUSIVELY for encoding real pack/cell state
// (alerts, imbalance, connection). Never used decoratively.
export const red = {
  50: '#FBE4E8', // critical.lighter — alert row tint
  300: '#E0687D',
  500: '#C81E3A', // critical — alarm red
  700: '#9E1730',
  800: '#8A1329',
  900: '#6E0F21',
};
export const orange = {
  50: '#FBEAD9', // warning.lighter
  300: '#E0965B',
  400: '#C46A1F',
  500: '#B6540A', // warning — burnt amber, not bright caution-yellow
  700: '#8A3F07',
  900: '#5C2A05',
};
export const green = {
  50: '#DFF3E6', // normal.lighter
  100: '#DFF3E6',
  200: '#2E8F52',
  300: '#5AA579',
  400: '#1C7C3F',
  500: '#1C7C3F', // normal — confident, not mint/pastel
  600: '#155F30',
  700: '#155F30',
  900: '#0E4020',
};

export const yellow = {
  500: '#D8A200',
};
