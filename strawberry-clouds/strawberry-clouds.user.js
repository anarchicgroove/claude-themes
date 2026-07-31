// ==UserScript==
// @name         Strawberry Clouds — Claude.ai
// @namespace    neb.strawberry.clouds
// @version      1.3.7
// @description  A soft pink strawberry-cloud light theme for claude.ai — blush-to-cream sky, drifting clouds, gentle sparkle, rosy glass panels, and cloud-scalloped message bubbles. Battery-conscious: no backdrop-blur, two compositor-only animations. Client-side only.
// @author       neb (creative director) & Claude (implementation)
// @match        https://claude.ai/*
// @match        https://*.claude.ai/*
// @run-at       document-start
// @inject-into  content
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  /* ==================================================================== *
   *  STRAWBERRY CLOUDS  v1.3.7
   *
   *  CHANGELOG v1.3.7
   *    · Share is painted, and THE SHARER is deleted entirely. A DOM
   *      probe settled it: Share is not in the header at all. It lives
   *      in div[data-testid="wiggle-controls-actions"], a chat-body
   *      container absolutely positioned into the top-right corner —
   *      structurally in the transcript, visually in the bar. Three
   *      versions of hunting inside <header> could never have found it.
   *    · It also has the stable hook I kept assuming didn't exist:
   *      data-testid="wiggle-controls-actions-share". So the word-hunt,
   *      the walk-up, the width cap and the throttle are all gone —
   *      ~80 lines of JS replaced by one CSS selector.
   *    · The probe also showed nothing in that ancestor chain paints:
   *      every background is transparent and every border is 0px. The
   *      white pill comes from the button's own pseudo-element or an
   *      inner layer, so both are cleared and the button paints itself.
   *      The ring is an inset box-shadow, not a border, so a button
   *      that ships border-0 doesn't shift 2px when we outline it.
   *
   *  
   *  PALETTE
   *    sky blush    #FFEAF1     sky cream    #FFF6EC
   *    page         #FFF0F5     panels       #FDE6EE
   *    bubble fill  #FFE4EF     bubble line  #F2A0C0
   *    body text    #7A4A5C     headings     #5C3543    muted #A87E8D
   *    accent pink  #EF8FB4     peach        #FFD3B4
   *
   *  BATTERY BUDGET (deliberate)
   *    · NO backdrop-filter anywhere — the "glass" is faked with a
   *      translucent gradient + an inner white highlight. Free.
   *    · Sparkle is ONE element with two tiled pseudo-layers, not 110
   *      individual twinkling spans. Two opacity animations total.
   *    · Cloud drift is a single transform animation (compositor-only,
   *      no repaint).
   *    · Bubble scallops are pure CSS gradients — no filters, no JS.
   *    · One MutationObserver (the markdown bloom, ported from Warm
   *      Paper) plus one light guard. Idle cost ~0.
   *
   *  NOTE: claude.ai stores theme colors as raw HSL triplets and wraps
   *  them in hsl(...) at point of use — the variables below MUST be
   *  triplets, not hex.
   * ==================================================================== */

  const THEME_CSS = `
  /* ==== 1. Theme variables — HSL triplet format ====================== */
  :root,
  html,
  html[data-mode="light"],
  html[data-mode="dark"],
  html.dark {
    /* background ramp: lightest -> deepest */
    --bg-000: 340 100% 98.8% !important;  /* dialogs, popovers   */
    --bg-100: 340 100% 97.1% !important;  /* page blush          */
    --bg-200: 339 85%  94.7% !important;  /* sidebar, panels     */
    --bg-300: 339 78%  91.0% !important;  /* hover states        */
    --bg-400: 339 73%  85.5% !important;  /* deep accents        */
    --bg-500: 339 70%  79.4% !important;

    /* text ramp: darkest -> lightest */
    --text-000: 338 28% 22.7% !important;
    --text-100: 338 27% 28.4% !important;  /* headings          */
    --text-200: 338 24% 38.4% !important;  /* body plum-cocoa   */
    --text-300: 340 19% 48.0% !important;
    --text-400: 339 19% 57.6% !important;  /* muted             */
    --text-500: 340 22% 67.5% !important;

    /* borders in rose */
    --border-100: 339 70% 88.0% !important;
    --border-200: 340 69% 83.5% !important;
    --border-300: 340 65% 77.6% !important;
    --border-400: 340 60% 72.0% !important;

    /* accents — strawberry, not coral */
    --accent-main-000: 340 72% 62% !important;
    --accent-main-100: 340 76% 68% !important;
    --accent-main-200: 340 80% 74% !important;
    --accent-secondary-000: 348 78% 68% !important;
    --accent-secondary-100: 348 82% 74% !important;
    --accent-secondary-200: 348 86% 80% !important;
    --accent-pro-000: 330 70% 66% !important;
    --accent-pro-100: 330 74% 72% !important;
    --accent-pro-200: 330 78% 78% !important;

    color-scheme: light;

    /* v1.3.0 — the author's handwriting font. Bradley Hand ships with iOS; the
       fallbacks only matter if the theme is ever opened on a desktop. */
    --sc-hand: 'Bradley Hand', 'Bradley Hand ITC', 'Noteworthy', 'Segoe Script', cursive;
  }

  /* ==== 2. The sky =================================================== */
  /* Painted on <html> ONLY. If body carries a background too, it paints
     over the decorative layers the moment the app hydrates. Learned
     that one the hard way on YouTube. */

  html {
    background:
      radial-gradient(ellipse 115% 62% at 82% -6%,  rgba(255, 190, 214, 0.62), transparent 62%),
      radial-gradient(ellipse 95%  56% at 4%  106%, rgba(255, 214, 184, 0.58), transparent 58%),
      radial-gradient(ellipse 70%  40% at 50% 45%,  rgba(255, 236, 244, 0.55), transparent 70%),
      linear-gradient(168deg, #FFEAF1 0%, #FFF4F7 42%, #FFF6EC 100%) !important;
    background-attachment: fixed !important;
    background-color: #FFF3F6 !important;
  }

  body {
    background: transparent !important;
    background-color: transparent !important;
  }

  /* NOTE (v1.2.0): there used to be a rule here giving every direct
     child of <body> position:relative + z-index:1, to lift the app above
     the sky. It also caught claude.ai's portal div — the one the image
     viewer renders into — and became its positioning anchor, sending
     expanded images to the bottom of the document. The sky now sits at
     z-index:-1 instead (see #sc-sky below), which puts it behind the
     app's content without touching a single one of the app's elements. */

  /* ==== 2b. Kill blur globally ======================================= */
  /* Mobile Safari re-blurs live pixels every frame — the single most
     expensive thing a theme can ask for. We fake glass instead. */
  * {
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }

  /* ==== 3. Sky layer: clouds + sparkle =============================== */

  #sc-sky {
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    overflow: hidden;
  }

  /* --- drifting strawberry clouds (one transform animation) --- */
  #sc-sky::before {
    content: '';
    position: absolute;
    top: -6%;
    left: -60%;
    width: 220%;
    height: 112%;
    background:
      radial-gradient(ellipse 16% 11% at 12% 22%, rgba(255, 255, 255, 0.90), transparent 68%),
      radial-gradient(ellipse 11% 8%  at 20% 27%, rgba(255, 245, 250, 0.82), transparent 70%),
      radial-gradient(ellipse 19% 12% at 38% 66%, rgba(255, 232, 241, 0.78), transparent 66%),
      radial-gradient(ellipse 13% 9%  at 47% 71%, rgba(255, 255, 255, 0.70), transparent 70%),
      radial-gradient(ellipse 15% 10% at 63% 16%, rgba(255, 240, 231, 0.72), transparent 68%),
      radial-gradient(ellipse 18% 12% at 82% 48%, rgba(255, 255, 255, 0.80), transparent 66%),
      radial-gradient(ellipse 12% 8%  at 89% 53%, rgba(255, 228, 238, 0.74), transparent 70%);
    animation: scDrift 150s linear infinite;
    will-change: transform;
  }

  @keyframes scDrift {
    from { transform: translate3d(0, 0, 0); }
    to   { transform: translate3d(-50%, 0, 0); }
  }

  /* --- sparkle: one tiled layer, one slow opacity breath --- */
  #sc-sky::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(circle at 18% 22%, rgba(255, 255, 255, 0.95) 0 1.2px, transparent 2px),
      radial-gradient(circle at 68% 11%, rgba(255, 200, 222, 0.95) 0 1.4px, transparent 2.2px),
      radial-gradient(circle at 41% 74%, rgba(255, 255, 255, 0.85) 0 1.1px, transparent 1.9px),
      radial-gradient(circle at 88% 61%, rgba(255, 216, 190, 0.90) 0 1.3px, transparent 2.1px),
      radial-gradient(circle at 7%  88%, rgba(255, 255, 255, 0.80) 0 1.0px, transparent 1.8px),
      radial-gradient(circle at 56% 39%, rgba(255, 190, 214, 0.85) 0 1.5px, transparent 2.3px);
    background-size: 240px 240px;
    animation: scTwinkle 7s ease-in-out infinite;
    will-change: opacity;
  }

  @keyframes scTwinkle {
    0%, 100% { opacity: 0.55; }
    50%      { opacity: 1;    }
  }

  /* ==== 4. Fake glass: panels, menus, dialogs ======================== */
  /* Translucent rose gradient + a white inner highlight along the top
     edge. Reads as frosted glass, costs the GPU nothing. */

  nav,
  aside,
  [class*="sidebar"] {
    background: linear-gradient(180deg,
      rgba(255, 248, 251, 0.93) 0%,
      rgba(255, 235, 243, 0.94) 100%) !important;
    border-right: 1px solid rgba(242, 187, 207, 0.45) !important;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.95),
      0 6px 26px rgba(232, 148, 180, 0.13) !important;
  }

  [role="dialog"],
  [role="menu"],
  [role="listbox"],
  [role="tooltip"],
  [data-radix-popper-content-wrapper] > div,
  [data-radix-menu-content] {
    background: linear-gradient(160deg,
      rgba(255, 250, 252, 0.90) 0%,
      rgba(255, 233, 242, 0.92) 100%) !important;
    border: 1px solid rgba(242, 176, 200, 0.55) !important;
    border-radius: 1.25rem !important;
    color: #6B4552 !important;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.95),
      0 10px 34px rgba(232, 148, 180, 0.20) !important;
  }

  /* the site's own surface utilities go translucent so the sky shows */
  .bg-bg-000 { background-color: rgba(255, 250, 252, 0.72) !important; }
  .bg-bg-100 { background-color: rgba(255, 243, 248, 0.62) !important; }
  .bg-bg-200 { background-color: rgba(253, 232, 241, 0.66) !important; }
  .bg-bg-300 { background-color: rgba(250, 218, 231, 0.74) !important; }

  /* ==== 5. Top bar — let the sky through ============================= */
  /* Warm Paper spent two whole versions fighting this bar. The lesson:
     don't paint it, just clear it and color the text. */
  header {
    background: transparent !important;
    background-color: transparent !important;
    box-shadow: none !important;
    border-bottom: none !important;
  }
  header :is(div, span, a, h1, h2, button) {
    color: #7A4A5C !important;
  }
  header :is(h1, h2, [class*="truncate"]) {
    font-family: var(--font-serif, "Copernicus", "Tiempos Text", Georgia, serif) !important;
  }
  /* Icon-only header controls ride bare on the sky (v1.3.4).
     This replaces the old button[class*="border"] rule, aimed at Share
     and hit only the chevron. "Has no truncated title inside it and
     wraps no truncated title" is what we meant: the chevron, the artifacts
     icon and the sidebar toggle all qualify, and the latter two were
     already bare, so nothing but the chevron changes. */
  header :is(button, a):not(:has([class*="truncate"])) {
    background: transparent !important;
    background-image: none !important;
    border-color: transparent !important;
    box-shadow: none !important;
  }

  /* the chat-title pill (v1.3.1) — warm peach gradient.
     Found by the truncated title it wraps, since the pill itself has no
     stable name. Listed after the Share rule on purpose: the two have
     equal specificity, so source order decides which wins if the title
     pill happens to carry a border class too. */
  header button:has([class*="truncate"]),
  header [role="button"]:has([class*="truncate"]) {
    background: linear-gradient(135deg,
      #FFE3C4 0%,
      #FFD6C6 46%,
      #FFCBD9 100%) !important;
    border: 1px solid rgba(240, 172, 146, 0.55) !important;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72) !important;
  }
  /* the pill's inner layers carry their own near-white fills — clear
     them so the gradient is the only thing painting */
  header button:has([class*="truncate"]) > *,
  header [role="button"]:has([class*="truncate"]) > * {
    background: transparent !important;
    background-image: none !important;
  }
  /* title text and chevron: deepened a shade for contrast on peach */
  header button:has([class*="truncate"]),
  header button:has([class*="truncate"]) :is(span, div, h1, h2),
  header button:has([class*="truncate"]) svg {
    color: #6E4150 !important;
  }

  /* ==== 5b. Share (v1.3.7) ==========================================
     Share is NOT in the header — it rides in the chat-body container
     div[data-testid="wiggle-controls-actions"], pinned to the top-right
     corner, which is why every header-scoped attempt missed it. It does
     carry a stable testid though, so no hunting is needed at all.

     Nothing in its ancestor chain paints: transparent backgrounds,
     0px borders. The white pill is drawn by the button's pseudo-element
     or an inner layer, so we mute those and let the button paint. The
     outline is an inset ring rather than a border — the button ships
     border-0, and adding a real border would nudge the bar 2px. */
  [data-testid="wiggle-controls-actions-share"] {
    background: linear-gradient(135deg,
      #FFEFDA 0%,
      #FFE5D4 52%,
      #FFDCDE 100%) !important;
    border-radius: 0.7rem !important;
    box-shadow:
      inset 0 0 0 1px rgba(240, 178, 168, 0.60),
      inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
    color: #6E4150 !important;
  }
  /* whatever was drawing the near-white pill, stand down */
  [data-testid="wiggle-controls-actions-share"]::before,
  [data-testid="wiggle-controls-actions-share"]::after {
    background: none !important;
    border: none !important;
    box-shadow: none !important;
  }
  /* muting the pseudo-element takes the press/hover state with it, so
     give it back: the same peach, one notch brighter */
  [data-testid="wiggle-controls-actions-share"]:hover,
  [data-testid="wiggle-controls-actions-share"]:active {
    background: linear-gradient(135deg,
      #FFF7EB 0%,
      #FFF0E4 52%,
      #FFE8EA 100%) !important;
  }
  [data-testid="wiggle-controls-actions-share"] :is(span, div, p, svg) {
    background: transparent !important;
    background-image: none !important;
    color: #6E4150 !important;
  }

  /* ==== 6. Composer — pink glass with a soft bloom =================== */

  fieldset {
    background: linear-gradient(155deg,
      rgba(255, 251, 253, 0.88) 0%,
      rgba(255, 234, 242, 0.90) 100%) !important;
    border: 1px solid rgba(242, 160, 192, 0.55) !important;
    border-radius: 1.6rem !important;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.98),
      0 0 24px rgba(244, 160, 195, 0.26),
      0 6px 30px rgba(232, 148, 180, 0.18) !important;
  }

  /* clear the stacked inner layers so one clean pane of glass shows */
  fieldset div,
  fieldset div[class],
  fieldset div[class] div[class] {
    background-color: transparent !important;
    background-image: none !important;
  }

  form:has(fieldset) {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }

  /* ==== 6c. The dock (v1.1.0) ======================================== *
   * The strip the composer sits in used to be fully transparent, so
   * scrolling chat text ran straight into the composer and the "Claude
   * is AI" disclaimer. Now it fades from clear at the top to solid
   * blush at the bottom: text dissolves as it approaches instead of
   * colliding, and the disclaimer sits on a clean surface.
   * The .sc-dock class is applied by the docker() pass below, since
   * this container has no stable class of its own.                     */

  div.sc-dock {
    background: linear-gradient(to bottom,
      rgba(255, 243, 248, 0)    0%,
      rgba(255, 243, 248, 0.72) 14%,
      rgba(255, 241, 246, 0.94) 34%,
      #FFF1F6                   62%) !important;
    border: none !important;
    box-shadow: none !important;
  }

  /* the disclaimer itself: readable, with a soft white halo so it
     never has to fight whatever is behind it */
  .sc-disclaimer,
  .sc-disclaimer * {
    color: #A2798A !important;
    text-shadow:
      0 0 6px rgba(255, 255, 255, 0.98),
      0 0 13px rgba(255, 255, 255, 0.85),
      0 0 22px rgba(255, 246, 250, 0.75) !important;
  }

  /* composer chrome: model name, icons, the + button */
  fieldset, fieldset * {
    color: #96667A !important;
  }

  /* what you type */
  /* v1.3.0: what you type matches what you send — Bradley Hand here
     too, so the composer isn't a different voice from the bubble. */
  div[contenteditable="true"],
  div[contenteditable="true"] p,
  textarea {
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
    color: #5C3543 !important;
    caret-color: #EF8FB4 !important;
    font-family: var(--sc-hand) !important;
    font-size: 1.06em !important;
  }
  ::placeholder,
  div[contenteditable="true"] p[data-placeholder]::before,
  [contenteditable] [data-placeholder]::before {
    color: #C79AAC !important;
    opacity: 1 !important;
    font-family: var(--sc-hand) !important;
  }

  /* ==== 6b. Send button — strawberry, not coral ====================== */
  button[aria-label*="send" i],
  fieldset button[type="submit"],
  .bg-accent-main-000,
  .bg-accent-main-100,
  .bg-accent-main-200 {
    background: linear-gradient(135deg, #F58BB4 0%, #FFA9C4 55%, #FFC2A8 100%) !important;
    border: 1px solid rgba(255, 210, 226, 0.70) !important;
    border-radius: 0.95rem !important;
    overflow: hidden !important;
    box-shadow:
      0 0 14px rgba(244, 140, 180, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.55) !important;
  }
  button[aria-label*="send" i] *,
  fieldset button[type="submit"] * {
    background: transparent !important;
    background-image: none !important;
    color: #ffffff !important;
  }

  /* ==== 7. YOUR bubble — the strawberry cloud ======================== */
  /*
   *  v1.1.0 — the lobes are now a BORDER-IMAGE, not a layer behind the
   *  bubble. Three reasons this is the right tool:
   *
   *  1. An element's border is painted as part of the element itself, so
   *     'overflow: hidden' never clips it. That means claude.ai keeps its
   *     own clipping for the "Show more" collapse and we stop breaking it.
   *  2. Nothing overhangs the bubble's box, so no ancestor needs its
   *     overflow meddled with either.
   *  3. 'border-image-repeat: round' scales the lobe tile so a whole
   *     number fits along each edge — symmetry is guaranteed by the
   *     browser instead of depending on the message being a lucky width.
   *
   *  The SVG below is a 54x54 tile sliced into nine 18px regions: eight
   *  outlined circles sitting on an inset body rect. The rect covers each
   *  circle's inner half, so only the outer arcs survive as scallops, and
   *  neighbouring circles are exactly tangent — continuous cloud edge, no
   *  notches. The centre region is the 'fill' and becomes the bubble body.
   */

  /* clear the ancestor wrappers (the ghost rectangle) — but DO NOT touch
     overflow here; that was the v1.0.0 mistake */
  div:has(> [data-testid="user-message"]),
  div:has(> div > [data-testid="user-message"]),
  div:has(> div > div > [data-testid="user-message"]),
  div:has(> div > div > div > [data-testid="user-message"]) {
    background: transparent !important;
    background-color: transparent !important;
    border-color: transparent !important;
    box-shadow: none !important;
  }
  div:has([data-testid="user-message"])::before,
  div:has([data-testid="user-message"])::after {
    background: transparent !important;
    box-shadow: none !important;
  }

  [data-testid="user-message"] {
    position: relative !important;
    background: transparent !important;
    background-color: transparent !important;
    color: #6B4552 !important;
    border: 18px solid transparent !important;
    border-image-source: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='54' height='54' viewBox='0 0 54 54'%3E%3Cg fill='%23FFE4EF' stroke='%23F2A0C0' stroke-width='1.6'%3E%3Ccircle cx='9' cy='9' r='8.2'/%3E%3Ccircle cx='27' cy='9' r='8.2'/%3E%3Ccircle cx='45' cy='9' r='8.2'/%3E%3Ccircle cx='9' cy='27' r='8.2'/%3E%3Ccircle cx='45' cy='27' r='8.2'/%3E%3Ccircle cx='9' cy='45' r='8.2'/%3E%3Ccircle cx='27' cy='45' r='8.2'/%3E%3Ccircle cx='45' cy='45' r='8.2'/%3E%3C/g%3E%3Crect x='9' y='9' width='36' height='36' fill='%23FFE4EF'/%3E%3C/svg%3E") !important;
    border-image-slice: 18 fill !important;
    border-image-repeat: round !important;
    border-radius: 0 !important;
    padding: 0.4rem 0.6rem !important;
    box-shadow: none !important;
  }

  [data-testid="user-message"] :is(p, li, span, div) {
    color: #6B4552 !important;
  }

  /* v1.3.0 — Bradley Hand throughout the bubble. It runs a little small
     and light next to the site's sans, so it gets a nudge in size and a
     touch more line-height to stay comfortable on a phone. Inline code
     is exempt: monospace has to stay monospace to be worth anything. */
  [data-testid="user-message"],
  [data-testid="user-message"] :is(p, li, span, div, strong, b, em, i, del, blockquote) {
    font-family: var(--sc-hand) !important;
  }
  [data-testid="user-message"] :is(p, li, blockquote) {
    font-size: 1.06em !important;
    line-height: 1.62 !important;
  }
  [data-testid="user-message"] :is(code, pre, code *, pre *) {
    font-family: ui-monospace, Menlo, Consolas, monospace !important;
    font-size: 0.88em !important;
  }

  /* ==== 7b. The collapse fade (v1.2.0) ============================== *
   * When a long message collapses behind "Show more", claude.ai lays a
   * gradient over the last couple of lines to fade them out. It fades
   * toward its own neutral, which read as a grey rectangle sitting
   * inside our pink cloud. Repaint it in the bubble's own colour so the
   * text dissolves into the cloud instead of into a grey box.
   *
   * Two ways in, because the overlay's class names aren't guaranteed:
   * the Tailwind-ish hooks below, plus a .sc-fade tag applied by the
   * fade-hunter in the JS (it finds any child actually painting a
   * gradient and marks it). Belt and braces.                          */

  [data-testid="user-message"] .sc-fade,
  [data-testid="user-message"] [class*="to-bg-"],
  [data-testid="user-message"] [class*="from-bg-"],
  [data-testid="user-message"] [class*="bg-gradient"] {
    background-color: transparent !important;
    background-image: linear-gradient(to bottom,
      rgba(255, 228, 239, 0)    0%,
      rgba(255, 228, 239, 0.70) 40%,
      rgba(255, 228, 239, 0.96) 76%,
      #FFE4EF                   100%) !important;
  }

  /* "Show more" / "Show less" in rose */
  [data-testid="user-message"] .sc-fade + *,
  div:has(> [data-testid="user-message"]) button {
    color: #B4638A !important;
  }

  /* ==== 8. Claude's messages ========================================= */

  .font-claude-message,
  .font-claude-response,
  [data-testid="assistant-message"] {
    background: transparent !important;
  }

  body :is(p, li, blockquote, td, th, figcaption, summary):not(pre *):not(code):not(code *) {
    color: #7A4A5C !important;
  }
  body :is(h1, h2, h3, h4, h5, h6, strong, b):not(pre *):not(code *) {
    color: #5C3543 !important;
  }

  /* italic action text gets a soft rose halo — static, so it costs one
     paint instead of a repaint every frame forever */
  .font-claude-message :is(em, i),
  .font-claude-response :is(em, i),
  [data-testid="assistant-message"] :is(em, i) {
    color: #C46A93 !important;
    text-shadow:
      0 0 7px rgba(255, 173, 205, 0.85),
      0 0 16px rgba(255, 196, 218, 0.45);
  }

  /* ==== 9. Quiet text stays quiet (thinking block, timestamps) ======= */
  body :is(p, li, span, div, summary):is([class*="text-text-3"], [class*="text-text-4"], [class*="text-text-5"]):not(pre *):not(code *),
  body :is([class*="text-text-3"], [class*="text-text-4"], [class*="text-text-5"]) :is(p, li, span, div):not(pre *):not(code *) {
    color: #B08C9B !important;
  }
  div[class*="grid-template-rows"] :is(p, li, span, div):not(pre *):not(code *),
  div[class*="grid-template-rows"] svg {
    color: #B08C9B !important;
  }
  div[class*="grid-template-rows"] * {
    border-color: #F6D3E0 !important;
  }

  /* ==== 10. Buttons & icons ========================================== */
  button:not([aria-label*="Send" i]):not([type="submit"]),
  button:not([aria-label*="Send" i]):not([type="submit"]) :is(span, div, p),
  button:not([aria-label*="Send" i]):not([type="submit"]) svg {
    color: #96667A !important;
  }

  /* ==== 11. Ambience ================================================= */
  ::selection {
    background: rgba(255, 176, 205, 0.55);
    color: #4A2A36;
  }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-thumb {
    background: rgba(240, 160, 192, 0.45);
    border-radius: 8px;
  }
  ::-webkit-scrollbar-track { background: transparent; }

  pre, code:not(.sc-code) {
    background-color: rgba(255, 240, 246, 0.85) !important;
  }

  /* ==== 12. Markdown bloom clothes =================================== */
  /* The JS below repaints YOUR sent bubbles (display-only) so **bold**,
     *italics*, \`code\`, # headers, ~~strikes~~ and --- dividers render.
     These give the rendered marks something pretty to wear. */
  [data-testid="user-message"] strong { font-weight: 700 !important; color: #5C3543 !important; }
  [data-testid="user-message"] em     { font-style: italic !important; color: #B4638A !important; }
  [data-testid="user-message"] del    { opacity: 0.6; }
  [data-testid="user-message"] code.sc-code {
    font-family: ui-monospace, Menlo, Consolas, monospace !important;
    font-size: 0.9em !important;
    background-color: rgba(255, 255, 255, 0.75) !important;
    color: #A34E78 !important;
    border: 1px solid rgba(242, 160, 192, 0.55) !important;
    border-radius: 0.35rem !important;
    padding: 0.05rem 0.35rem !important;
  }
  [data-testid="user-message"] p.sc-h1 { font-size: 1.35em !important; font-weight: 700 !important; color: #5C3543 !important; }
  [data-testid="user-message"] p.sc-h2 { font-size: 1.2em  !important; font-weight: 700 !important; color: #5C3543 !important; }
  [data-testid="user-message"] p.sc-h3 { font-size: 1.05em !important; font-weight: 700 !important; color: #5C3543 !important; }
  [data-testid="user-message"] p.sc-hr {
    border-top: 1px solid rgba(242, 160, 192, 0.6) !important;
    height: 0 !important;
    margin: 0.6rem 0 !important;
    overflow: hidden !important;
  }

  /* ==== 13. Reduced motion =========================================== */
  @media (prefers-reduced-motion: reduce) {
    #sc-sky::before, #sc-sky::after { animation: none; }
  }
  `;

  /* ------------------------------------------------------------------ *
   *  Injection
   * ------------------------------------------------------------------ */

  const STYLE_ID = 'strawberry-clouds-style';
  const SKY_ID   = 'sc-sky';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = THEME_CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  /* ------------------------------------------------------------------ *
   *  THE DOCKER (v1.1.0) — ported from Cosmic Nebula's disclaimer hunt
   *
   *  The "Claude is AI and can make mistakes" line has no stable class,
   *  id or aria-label, so we find it by its wording — once — and tag it.
   *  From there we walk up a few levels to the container that also holds
   *  the composer, and tag that as the dock so CSS can paint its fade.
   *
   *  Cost: runs only while .sc-dock is missing. Once tagged, every later
   *  call exits on the first line. Effectively free at idle.
   * ------------------------------------------------------------------ */

  function docker() {
    if (document.querySelector('.sc-dock')) return;
    try {
      let best = null;
      for (const el of document.querySelectorAll('div, p, span')) {
        const t = el.textContent;
        if (!t || t.length > 140) continue;
        if (!/can make mistakes/i.test(t)) continue;
        if (!best || t.length < best.textContent.length) best = el;
      }
      if (!best) return;
      best.classList.add('sc-disclaimer');

      /* walk up for the container that also holds the composer, but
         refuse anything tall enough to be the whole page */
      let p = best.parentElement;
      for (let i = 0; i < 5 && p; i++) {
        if (p.querySelector('fieldset')) {
          if (p.getBoundingClientRect().height < window.innerHeight * 0.5) {
            p.classList.add('sc-dock');
          }
          return;
        }
        p = p.parentElement;
      }
    } catch (e) { /* never break the page over a disclaimer */ }
  }

  function buildSky() {
    if (!document.body || document.getElementById(SKY_ID)) return;
    const sky = document.createElement('div');
    sky.id = SKY_ID;
    sky.setAttribute('aria-hidden', 'true');
    document.body.prepend(sky);
  }

  injectStyle();

  /* ------------------------------------------------------------------ *
   *  MARKDOWN BLOOM  (ported from Warm Paper v1.9.0, classes renamed)
   *
   *  Display-only: we repaint the pixels of your sent bubbles, never the
   *  underlying message. Edit / copy / regenerate all read the app's own
   *  state, so the raw text keeps its asterisks. The composer is left
   *  alone on purpose — rewriting a live input risks cursor jumps.
   * ------------------------------------------------------------------ */

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function inlineMd(raw) {
    let s = esc(raw);
    s = s.replace(/`([^`]+)`/g, '<code class="sc-code">$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*(\S(?:[^*\n]*\S)?)\*/g, '<em>$1</em>');
    s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    return s;
  }

  const MD_HINT = /(\*\*|\*[^*]|`|~~|^#{1,3}\s|^\s*---\s*$)/;

  function processParagraph(p) {
    const raw = p.textContent;
    if (!MD_HINT.test(raw)) return;

    const trimmed = raw.trim();
    if (/^---+$/.test(trimmed)) {
      p.textContent = '';
      p.classList.add('sc-hr');
      return;
    }
    const h = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      p.innerHTML = inlineMd(h[2]);
      p.classList.add('sc-h' + h[1].length);
      return;
    }
    p.innerHTML = inlineMd(raw);
  }

  function processBubble(bubble) {
    if (bubble.dataset.scMd !== '1') {
      bubble.dataset.scMd = '1';
      bubble.querySelectorAll('p').forEach(processParagraph);
    }
    tagFades(bubble);
  }

  /* ---- fade-hunter (v1.2.0) ---------------------------------------- *
   * The "Show more" fade overlay has no dependable class name, so we
   * find it by what it actually paints: any div inside a bubble whose
   * computed background-image is a gradient gets tagged .sc-fade, and
   * the CSS repaints it in bubble pink. Each div is inspected exactly
   * once (data-sc-fade), so a bubble costs a handful of style reads on
   * first sight and nothing ever after.                                */

  function tagFades(bubble) {
    try {
      for (const el of bubble.querySelectorAll('div')) {
        if (el.dataset.scFade) continue;
        el.dataset.scFade = '1';
        const bg = getComputedStyle(el).backgroundImage || '';
        if (bg.indexOf('gradient') !== -1) el.classList.add('sc-fade');
      }
    } catch (e) { /* never break the page over a gradient */ }
  }

  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.matches && root.matches('[data-testid="user-message"]')) processBubble(root);
    root.querySelectorAll('[data-testid="user-message"]').forEach(processBubble);
    /* the overlay is often added later than the bubble it lives in */
    if (root.closest) {
      const host = root.closest('[data-testid="user-message"]');
      if (host) tagFades(host);
    }
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1) scan(node);
      }
    }
    /* cheap self-heal: if hydration nuked our layers, put them back */
    if (!document.getElementById(STYLE_ID)) injectStyle();
    if (document.body && !document.getElementById(SKY_ID)) buildSky();
    docker();
  });

  function boot() {
    injectStyle();
    buildSky();
    docker();
    scan(document.documentElement);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    /* burst pass: claude.ai builds its chrome after load, so look for the
       disclaimer a few times early rather than waiting on a mutation */
    let bursts = 0;
    const burst = setInterval(() => {
      docker();
      if (++bursts >= 20 || document.querySelector('.sc-dock')) clearInterval(burst);
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
