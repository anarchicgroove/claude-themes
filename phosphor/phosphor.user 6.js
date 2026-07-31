// ==UserScript==
// @name         Phosphor — Claude.ai
// @namespace    neb.phosphor
// @version      1.4.0
// @description  A retro CRT terminal theme for claude.ai — black glass, faint tiled binary, 3px scanlines, monospace throughout, and no message bubbles at all: your messages are prompts, Claude's are output. Phosphor green bloom on the composer, the caret and the prompt only. Battery-conscious: one animation in the whole theme. Client-side only.
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
   *  PHOSPHOR  v1.4.0
   *
   *  CHANGELOG v1.4.0
   *    · THE ICONS WERE NEVER INVISIBLE. THEY WERE GONE — and this
   *      theme is what removed them. Samara's observation, and it
   *      cracked the case: some claude.ai icons are not svg drawings
   *      but CHARACTERS — one private-use glyph in a span, rendered by
   *      an icon font. Phosphor forces monospace onto every span in
   *      the nav, header, composer and buttons; forcing a font onto an
   *      icon span replaces the icon font, the mono face has no glyph
   *      at that codepoint, and the browser draws nothing at all. Which
   *      is why the popup menus survived (the one region the font rules
   *      never touched), why Ink never had the bug (it only fonted the
   *      title and messages, never the chrome), and why three rounds of
   *      svg surgery changed nothing — there were no pixels to operate
   *      on.
   *    · Fix: tagGlyphs() finds leaf elements whose text is one or two
   *      private-use-area characters — the unmistakable signature of an
   *      icon font — and tags them data-ph-glyph. Every font-family
   *      rule that reaches chrome now carries :not([data-ph-glyph]),
   *      so the icon font is left to do its job. Tagged glyphs are
   *      painted phosphor inline so they join the theme.
   *
   *  CHANGELOG v1.3.0
   *    · THE ICONS, ACTUALLY THIS TIME. v1.2.0 built the right machine
   *      and then fed it a bad test. paintIcon() decided ONCE PER ICON
   *      whether the whole thing was an outline drawing, and if any
   *      single shape anywhere inside it said fill="none", it treated
   *      every other shape as outlined too and refused to fill them.
   *      Most claude.ai icons are mixed — a filled body with an unfilled
   *      detail cut into it — so the ones with any hollow part at all
   *      kept inheriting the document's default fill, which is black,
   *      on a black page. The icons in an open menu are pure outline
   *      drawings, which is the entire reason THOSE worked and the
   *      sidebar, the drawer toggle, the + key and the chevrons didn't.
   *      The test is now made per SHAPE instead of per icon.
   *    · And because I have now been wrong about this three times in a
   *      row, there is a second pass that does not guess at all:
   *      verify() reads the COMPUTED fill and stroke of every shape
   *      after painting, and anything the browser is actually about to
   *      draw in near-black gets phosphor instead. It does not care how
   *      the icon was authored. See the note above it.
   *
   *  CHANGELOG v1.2.0
   *    · THE ICONS, PROPERLY THIS TIME. Two rounds of CSS guessed at
   *      where those icons live and what they are made of, and both
   *      guesses lost. The one thing that DID land in v1.1.0 was the
   *      pixel arrow — because it is drawn from nothing and depends on
   *      no markup at all. So the fix has moved to JS: iconize() finds
   *      every icon on the page, works out from the element itself
   *      whether it is an outline icon, a solid icon or a masked one,
   *      and writes the paint back as an INLINE !important style.
   *      Inline important beats every stylesheet in the document, so it
   *      no longer matters which container they sit in or which of the
   *      three techniques claude.ai used to draw them.
   *    · Belt and braces: the dim end of the text ramp came up too, so
   *      that any icon riding a --text-400 / --text-500 variable is
   *      legible even if the JS never reaches it.
   *    · Binary 0.10 -> 0.24, vignette 0.55 -> 0.42, scanlines 0.22 ->
   *      0.18. The last two were quietly eating the first one: the
   *      binary sits UNDER both, so every point I added was being
   *      partly taken back. Raising one number and not the others is
   *      why the last bump did nothing you could see.
   *
   *  CHANGELOG v1.1.0
   *    · THE ICON BUG. Sidebar rows, top bar, composer chrome and the
   *      message action buttons were all invisible. Five symptoms, one
   *      cause: those icons declare no paint of their own and inherit
   *      fill from the document, which on a black page means black on
   *      black. Colouring them was never going to be enough — the fill
   *      had to be given back. New Section 14 does exactly that, and is
   *      written to leave multi-colour brand marks alone.
   *    · The send key now draws its own PIXEL ARROW, nineteen white
   *      blocks made of box-shadows. The native glyph is hidden, which
   *      also sidesteps whatever was eating it.
   *    · Binary opacity 0.05 -> 0.10. It was texture; now it is texture
   *      you can actually see.
   *
   *  Forked from Ink & Candlelight v1.3.0, which came from Matcha
   *  Mornings v1.1.0, which came from Strawberry Clouds v1.3.7. As
   *  always, this header records only what CHANGED, so the seam between
   *  the inherited chassis and the new flavour stays legible.
   *
   *  THE IDEA
   *  An old CRT terminal that happens to be running something new.
   *  Retro in the TEXTURE, futuristic in the LIGHT. The grain, the
   *  scanlines and the vignette are 1984; the bloom is clean and the
   *  type is precise, which is what keeps it from being a costume.
   *
   *  THE STRUCTURAL MOVE (this is the theme)
   *  There are NO BUBBLES. Not restyled bubbles — none. A terminal has
   *  no containers, it has a prompt and it has output. So:
   *
   *    · Your messages lose their fill, their border, their rounding
   *      and their padding entirely, and gain a bright green ">" in the
   *      gutter. Wrapped lines hang off it the way real terminal output
   *      wraps.
   *    · Claude's replies get no container whatsoever — just softer
   *      mint text running down the black.
   *    · Your messages are left-aligned to match. Right-aligned would
   *      mean the prompt column moves around, and a prompt that moves
   *      is not a prompt.
   *
   *  The ABSENCE of the bubble is the design. It is the exact inverse
   *  of Strawberry's cloud bubbles, and I remain delighted by that.
   *
   *  THE LIGHT DISCIPLINE (the thing most terminal themes get wrong)
   *  Glow goes on the composer, the caret, the send key, the ">" prompt
   *  and the block cursor. It does NOT go on body text. Phosphor bloom
   *  on a thousand words turns the third paragraph into a smear. Real
   *  terminals were extremely readable — the glow was a property of the
   *  phosphor coating, not of the letterforms.
   *
   *  Which is also why there are TWO greens:
   *    · #00FF41 — pure phosphor. Icons, accents, the prompt, the
   *      caret, the cursor, the send key, the current sidebar row.
   *      Used on short runs of text and small objects only.
   *    · mint ramp — body copy, dropped in saturation and lifted in
   *      lightness so you can read a long reply without your eyes
   *      vibrating. Still unmistakably green; just not shouting.
   *
   *  PALETTE
   *    void        #040604    page mix   #060A07    panels  #080D09
   *    phosphor    #00FF41    lit        #4DFF80
   *    mint body   #86E9A2    headings   #CFFFDD    muted   #46A05F
   *    scanline    black @ 22%, 3px pitch
   *
   *  BATTERY BUDGET
   *    · ONE animation in the entire theme: the block cursor's blink,
   *      on a single element, opacity only, steps(1) so it isn't even
   *      interpolating. Cheaper than Ink's breathing lamp.
   *    · The binary is a STATIC tiled SVG at ~5%. Not falling Matrix
   *      rain. Rain animates forever, eats battery, and crawls behind
   *      the text you are trying to read. Static binary reads as
   *      texture; falling binary reads as a screensaver you can't turn
   *      off.
   *    · Scanlines and vignette are static gradients.
   *    · NO backdrop-filter anywhere.
   *    · Two MutationObserver consumers, both throttled and guarded.
   *
   *  INSTALL NOTE
   *  This is a dark theme, so set claude.ai's own appearance setting to
   *  Dark. Some chrome (the model picker especially) paints from the
   *  app's own mode rather than from CSS variables.
   * ==================================================================== */

  const THEME_CSS = `
  /* ==== 1. Theme variables — HSL triplet format ======================
   * Dark theme, so the text ramp is INVERTED exactly as in Ink: --text-000
   * is the PALEST value, because claude.ai reaches for 000 when it wants
   * maximum contrast and on black that means near-white mint, not ink.
   * Every hue in this file sits around 135-140 so the whole screen is one
   * phosphor coating rather than a set of greens that don't know each
   * other.                                                             */
  :root,
  html,
  html[data-mode="light"],
  html[data-mode="dark"],
  html.dark {
    /* background ramp: raised surfaces -> deep furniture */
    --bg-000: 132 20%  5.0% !important;   /* dialogs, popovers    */
    --bg-100: 130 14%  2.6% !important;   /* page                 */
    --bg-200: 133 22%  4.0% !important;   /* sidebar, panels      */
    --bg-300: 130 22%  7.5% !important;   /* hover states         */
    --bg-400: 130 20% 11.5% !important;
    --bg-500: 130 18% 16.5% !important;

    /* text ramp: palest -> dimmest */
    --text-000: 138 100% 91.0% !important;
    --text-100: 138  85% 82.0% !important;  /* headings           */
    --text-200: 137  69% 72.0% !important;  /* body mint          */
    /* v1.2.0: 300-500 all came up. On a light theme the dim end of the
       ramp is a whisper; on a page this black it is a disappearing act,
       and claude.ai hangs plenty of ICONS off these variables, not just
       quiet text. If anything is still too dark to read, this is the
       first place to look before touching a selector. */
    --text-300: 138  55% 66.0% !important;
    --text-400: 137  45% 56.0% !important;  /* muted              */
    --text-500: 137  42% 47.0% !important;

    /* borders: green, low, never grey */
    --border-100: 137 40% 14.0% !important;
    --border-200: 137 46% 20.0% !important;
    --border-300: 137 52% 26.0% !important;
    --border-400: 137 58% 33.0% !important;

    /* the accent — pure phosphor */
    --accent-main-000: 135 100% 44% !important;
    --accent-main-100: 135 100% 50% !important;
    --accent-main-200: 135 100% 58% !important;
    --accent-secondary-000: 158 90% 38% !important;
    --accent-secondary-100: 158 92% 44% !important;
    --accent-secondary-200: 158 94% 52% !important;
    --accent-pro-000: 135 90% 42% !important;
    --accent-pro-100: 135 92% 48% !important;
    --accent-pro-200: 135 94% 56% !important;

    color-scheme: dark;

    /* SF Mono ships with modern iOS; Menlo has shipped with every iOS
       ever and is a genuinely good screen mono. Courier last, because
       Courier is what a terminal font looks like to someone who has
       never used a terminal. NOT all caps anywhere — see Section 8. */
    --ph-mono: ui-monospace, 'SF Mono', 'SFMono-Regular', Menlo, Monaco,
               'Cascadia Mono', Consolas, 'Courier New', monospace;
  }

  /* ==== 2. The void ==================================================
   * Painted on <html> ONLY. Three notes on the black:
   *   · It is very slightly GREEN, not neutral and never blue. A CRT at
   *     rest still has a faint cast from the coating; pure #000 reads as
   *     OLED off, which is a different and colder idea.
   *   · One wide pool of screen-glow up top, off-centre, so the tube
   *     looks like it's being driven from somewhere.
   *   · A dimmer pool low down so the bottom of a long conversation
   *     doesn't fall off a cliff into nothing.                        */

  html {
    background:
      radial-gradient(ellipse 104% 46% at 42% -14%, rgba(0, 255, 65, 0.075), transparent 66%),
      radial-gradient(ellipse 66% 34% at 86% 14%,  rgba(0, 220, 90, 0.035), transparent 68%),
      radial-gradient(ellipse 120% 54% at 50% 118%, rgba(0, 180, 60, 0.045), transparent 64%),
      linear-gradient(178deg, #050805 0%, #060A07 48%, #030503 100%) !important;
    background-attachment: fixed !important;
    background-color: #040604 !important;
  }

  body {
    background: transparent !important;
    background-color: transparent !important;
  }

  /* ==== 2b. Kill blur globally ======================================= */
  * {
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }

  /* ==== 3. The CRT layer: binary, scanlines, vignette ================
   * All static. Two pseudo-elements on one fixed div.
   *
   *   ::before  the binary. A 300px tile of 1s and 0s at 5% opacity,
   *             fixed so it does NOT scroll with the text — it is the
   *             coating on the glass, not part of the document. Rows are
   *             deliberately ragged (varying length and indent) so it
   *             reads as data rather than as a grid.
   *
   *   ::after   scanlines + vignette. Pitch is 3px: 1px line, 2px gap.
   *             This is the one number in the theme worth being fussy
   *             about. Tighter than 3px and the lines beat against the
   *             pixel grid on some panels and moire horribly — which is
   *             the difference between atmospheric and nauseating, and
   *             it can flip without warning between two phones. Started
   *             deliberately subtle; easy to push if you want more.   */

  #ph-crt {
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    overflow: hidden;
  }

  #ph-crt::before {
    content: '';
    position: absolute;
    inset: -20px;
    /* v1.2.0: 0.05 -> 0.10 -> 0.24. The first bump was invisible and it
       was my fault for treating this number in isolation: the binary is
       painted UNDERNEATH both the scanlines and the vignette, so a good
       part of every point I added here was being taken straight back
       out by the layer above. Both of those came down at the same time
       this round, which is why 0.24 is not as loud as it sounds.
       This is still the tuning knob — nudge freely. */
    opacity: 0.24;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Cg font-family='Menlo,Consolas,monospace' font-size='13' letter-spacing='2.6' fill='%2300FF41'%3E%3Ctext x='3' y='15.0'%3E001 1100010010%3C/text%3E%3Ctext x='1' y='36.5'%3E11001100000001100%3C/text%3E%3Ctext x='6' y='58.0'%3E0110001011000001%3C/text%3E%3Ctext x='6' y='79.5'%3E10011000000101%3C/text%3E%3Ctext x='1' y='101.0'%3E01111 01001111110%3C/text%3E%3Ctext x='1' y='122.5'%3E00100001 0010101%3C/text%3E%3Ctext x='3' y='144.0'%3E000001001011101%3C/text%3E%3Ctext x='1' y='165.5'%3E111110011010 100%3C/text%3E%3Ctext x='1' y='187.0'%3E00111101000100%3C/text%3E%3Ctext x='1' y='208.5'%3E0100100101 001%3C/text%3E%3Ctext x='6' y='230.0'%3E01011 11100011101%3C/text%3E%3Ctext x='1' y='251.5'%3E01111000100011101%3C/text%3E%3Ctext x='6' y='273.0'%3E1100 100111111%3C/text%3E%3Ctext x='3' y='294.5'%3E0101011110 0011%3C/text%3E%3C/g%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 300px 300px;
  }

  #ph-crt::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      repeating-linear-gradient(to bottom,
        rgba(0, 0, 0, 0.18) 0px,
        rgba(0, 0, 0, 0.18) 1px,
        rgba(0, 0, 0, 0)    1px,
        rgba(0, 0, 0, 0)    3px),
      radial-gradient(ellipse 78% 62% at 50% 46%,
        transparent 40%,
        rgba(0, 0, 0, 0.42) 100%);
  }

  /* ==== 4. Panels, menus, dialogs ====================================
   * No glass and no lift-by-lightness here — on a screen this dark the
   * surfaces are distinguished by their EDGE. Every panel is a black box
   * with a green hairline, which is what a windowed terminal looks like.
   *
   * NOTE ON THE DIVIDER: inset shadow, never border-right. The drawer
   * slides off-canvas by exactly its own width, so a real border sits at
   * x=0 when closed and shows as a stray hairline down the screen edge.
   * An inset shadow is drawn inside the box and leaves with it. Carried
   * forward from Ink v1.2.0; still needs back-porting to Strawberry and
   * Matcha.                                                            */
  nav,
  aside,
  [class*="sidebar"] {
    background: linear-gradient(180deg,
      rgba(8, 14, 10, 0.97) 0%,
      rgba(4, 7, 5, 0.98) 100%) !important;
    border-right: none !important;
    box-shadow:
      inset -1px 0 0 rgba(0, 255, 65, 0.26),
      inset 0 1px 0 rgba(0, 255, 65, 0.08),
      0 8px 34px rgba(0, 0, 0, 0.7) !important;
  }

  [role="dialog"],
  [role="menu"],
  [role="listbox"],
  [role="tooltip"],
  [data-radix-popper-content-wrapper] > div,
  [data-radix-menu-content] {
    background: linear-gradient(160deg,
      rgba(9, 16, 11, 0.98) 0%,
      rgba(4, 8, 5, 0.99) 100%) !important;
    border: 1px solid rgba(0, 255, 65, 0.34) !important;
    border-radius: 2px !important;
    color: #A9F8C0 !important;
    box-shadow:
      inset 0 1px 0 rgba(0, 255, 65, 0.10),
      0 0 22px rgba(0, 255, 65, 0.07),
      0 14px 44px rgba(0, 0, 0, 0.72) !important;
  }

  .bg-bg-000 { background-color: rgba(9, 16, 11, 0.82) !important; }
  .bg-bg-100 { background-color: rgba(4, 7, 5, 0.62) !important; }
  .bg-bg-200 { background-color: rgba(7, 12, 8, 0.74) !important; }
  .bg-bg-300 { background-color: rgba(13, 22, 15, 0.82) !important; }

  /* ==== 5. Top bar — let the tube through ============================ */
  header {
    background: transparent !important;
    background-color: transparent !important;
    box-shadow: none !important;
    border-bottom: none !important;
  }
  header :is(div, span, a, h1, h2, button) {
    color: #86E9A2 !important;
  }
  /* font SEPARATELY from colour, here and in every chrome rule below:
     an icon-font glyph wants the theme's colour but must keep its own
     font, or it stops existing. See tagGlyphs() and changelog v1.4.0. */
  header :is(div, span, a, h1, h2, button):not([data-ph-glyph]) {
    font-family: var(--ph-mono) !important;
  }
  header :is(button, a):not(:has([class*="truncate"])) {
    background: transparent !important;
    background-image: none !important;
    border-color: transparent !important;
    box-shadow: none !important;
  }

  /* the chat-title pill. Strawberry and Matcha make this a gradient;
     here it is a hard-cornered box with a hairline, because a rounded
     pill is the single most 2015-app-looking object available and it
     would undo the whole theme in one element. */
  header button:has([class*="truncate"]),
  header [role="button"]:has([class*="truncate"]) {
    background: rgba(0, 255, 65, 0.045) !important;
    border: 1px solid rgba(0, 255, 65, 0.34) !important;
    border-radius: 2px !important;
    box-shadow: none !important;
  }
  header button:has([class*="truncate"]) > *,
  header [role="button"]:has([class*="truncate"]) > * {
    background: transparent !important;
    background-image: none !important;
  }
  header button:has([class*="truncate"]),
  header button:has([class*="truncate"]) :is(span, div, h1, h2),
  header button:has([class*="truncate"]) svg {
    color: #A9F8C0 !important;
  }

  /* ==== 5b. Share ====================================================
     Share is NOT in the header — it rides in the chat body under
     data-testid="wiggle-controls-actions-share". The white pill is drawn
     by the button's own pseudo-element, so mute that and let the button
     paint. Ring is an inset shadow, not a border: the button ships
     border-0 and a real border nudges the bar 2px. */
  [data-testid="wiggle-controls-actions-share"] {
    background: rgba(0, 255, 65, 0.05) !important;
    border-radius: 2px !important;
    box-shadow:
      inset 0 0 0 1px rgba(0, 255, 65, 0.40),
      inset 0 1px 0 rgba(0, 255, 65, 0.10) !important;
    color: #A9F8C0 !important;
    font-family: var(--ph-mono) !important;
  }
  [data-testid="wiggle-controls-actions-share"]::before,
  [data-testid="wiggle-controls-actions-share"]::after {
    background: none !important;
    border: none !important;
    box-shadow: none !important;
  }
  /* muting the pseudo-element takes the press state with it — give it
     back as an inverse-video flash, which is how a terminal acknowledges
     a keypress */
  [data-testid="wiggle-controls-actions-share"]:hover,
  [data-testid="wiggle-controls-actions-share"]:active {
    background: rgba(0, 255, 65, 0.90) !important;
    box-shadow: inset 0 0 0 1px rgba(0, 255, 65, 1) !important;
    color: #030503 !important;
  }
  [data-testid="wiggle-controls-actions-share"]:hover :is(span, div, p, svg),
  [data-testid="wiggle-controls-actions-share"]:active :is(span, div, p, svg) {
    color: #030503 !important;
  }
  [data-testid="wiggle-controls-actions-share"] :is(span, div, p, svg) {
    background: transparent !important;
    background-image: none !important;
    color: #A9F8C0 !important;
  }

  /* ==== 6. Composer — the lit part of the screen =====================
   * This is where the futurism lives, and it is the ONLY place a real
   * bloom is allowed. Five shadows, read outward:
   *   1. inset   phosphor bleeding through the glass from behind
   *   2. 0 0 0 1 the border's own tight halo, so the line reads as
   *              glowing rather than as a second border
   *   3. 18px    the near bloom
   *   4. 48px    the far falloff, very low, so the light has somewhere
   *              to end. Without it the glow stops dead and reads as a
   *              rectangle of fog rather than as light.
   *   5. black   a hard drop, which is what actually separates it from
   *              the page
   * Static. A pulsing composer would be a notification, not a mood.  */

  fieldset {
    background: linear-gradient(168deg,
      rgba(8, 16, 10, 0.94) 0%,
      rgba(4, 9, 6, 0.96) 100%) !important;
    border: 1px solid rgba(0, 255, 65, 0.46) !important;
    border-radius: 3px !important;
    box-shadow:
      inset 0 0 26px rgba(0, 255, 65, 0.06),
      0 0 0 1px rgba(0, 255, 65, 0.12),
      0 0 18px rgba(0, 255, 65, 0.22),
      0 0 48px rgba(0, 255, 65, 0.10),
      0 10px 34px rgba(0, 0, 0, 0.62) !important;
  }

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

  /* ==== 6b. Send key — inverse video ================================= *
   * The one solid object on the screen. Filled pure phosphor with a
   * black glyph, because inverse video IS the terminal idiom for "this
   * is the active thing", and because in a room this dark one solid
   * block of light carries more weight than any amount of glow.       */
  button[aria-label*="send" i],
  fieldset button[type="submit"],
  .bg-accent-main-000,
  .bg-accent-main-100,
  .bg-accent-main-200 {
    background: #00FF41 !important;
    background-image: none !important;
    border: 1px solid rgba(120, 255, 170, 0.55) !important;
    border-radius: 2px !important;
    overflow: hidden !important;
    box-shadow:
      0 0 12px rgba(0, 255, 65, 0.45),
      0 0 30px rgba(0, 255, 65, 0.18) !important;
  }
  button[aria-label*="send" i] *,
  fieldset button[type="submit"] * {
    background: transparent !important;
    background-image: none !important;
    color: #021004 !important;
  }

  /* --- the pixel arrow (v1.1.0) -----------------------------------
   * Nineteen 3px blocks, drawn as one element plus eighteen
   * box-shadows, in the shape of a classic 7x7 bitmap arrow:
   *
   *        # # #
   *      # # # # #
   *    # # # # # # #
   *          #
   *          #
   *          #
   *
   * Everything about this is deliberate. A pixel arrow cannot be
   * antialiased, cannot be scaled wrong, and cannot inherit a colour
   * from anything — it is white because the box-shadow says white. It
   * is also the only truly LOW-resolution object in a theme that is
   * otherwise pin-sharp, which is what makes it read as retro rather
   * than as merely green.
   *
   * The native glyph is hidden rather than restyled. It was invisible
   * anyway (phosphor-on-phosphor, see Section 14), and drawing our own
   * removes any dependency on what claude.ai ships in there.
   *
   * SCOPED TO SEND ONLY, never [type="submit"] generally, so that when
   * the button becomes Stop mid-reply it keeps its own square glyph
   * instead of wearing an arrow that no longer means anything.      */

  button[aria-label*="send" i] {
    position: relative !important;
    border-radius: 2px !important;
  }
  button[aria-label*="send" i] svg {
    display: none !important;
  }
  button[aria-label*="send" i]::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 3px;
    height: 3px;
    background: #F2FFF6;
    transform: translate(-1.5px, -10.5px);
    pointer-events: none;
    box-shadow:
      -3px  3px 0 0 #F2FFF6,  0px  3px 0 0 #F2FFF6,  3px  3px 0 0 #F2FFF6,
      -6px  6px 0 0 #F2FFF6, -3px  6px 0 0 #F2FFF6,  0px  6px 0 0 #F2FFF6,
       3px  6px 0 0 #F2FFF6,  6px  6px 0 0 #F2FFF6,
      -9px  9px 0 0 #F2FFF6, -6px  9px 0 0 #F2FFF6, -3px  9px 0 0 #F2FFF6,
       0px  9px 0 0 #F2FFF6,  3px  9px 0 0 #F2FFF6,  6px  9px 0 0 #F2FFF6,
       9px  9px 0 0 #F2FFF6,
       0px 12px 0 0 #F2FFF6,  0px 15px 0 0 #F2FFF6,  0px 18px 0 0 #F2FFF6;
  }

  /* ==== 6c. The dock ================================================= *
   * The strip the composer sits in fades from clear to solid void, so
   * scrolling output dissolves into the dark instead of colliding with
   * the composer. .ph-dock is applied by docker() below — this container
   * has no stable class of its own.                                    */

  div.ph-dock {
    background: linear-gradient(to bottom,
      rgba(4, 6, 4, 0)    0%,
      rgba(4, 6, 4, 0.76) 14%,
      rgba(4, 6, 4, 0.95) 34%,
      #040604             62%) !important;
    border: none !important;
    box-shadow: none !important;
  }

  .ph-disclaimer,
  .ph-disclaimer * {
    color: #3E8A52 !important;
    font-family: var(--ph-mono) !important;
    font-size: 0.78em !important;
    text-shadow:
      0 0 6px rgba(4, 6, 4, 0.98),
      0 0 14px rgba(4, 6, 4, 0.92) !important;
  }

  /* composer chrome: model name, icons, the + button */
  fieldset, fieldset * {
    color: #6FD68C !important;
  }
  fieldset, fieldset *:not([data-ph-glyph]) {
    font-family: var(--ph-mono) !important;
  }

  /* what you type. The caret is pure phosphor and it BLOOMS — a caret is
     one glyph wide, so glow costs nothing here and it is the single most
     "live terminal" detail in the theme. */
  div[contenteditable="true"],
  div[contenteditable="true"] p,
  textarea {
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
    color: #CFFFDD !important;
    caret-color: #00FF41 !important;
    font-family: var(--ph-mono) !important;
    font-size: 0.94em !important;
    line-height: 1.58 !important;
  }
  ::placeholder,
  div[contenteditable="true"] p[data-placeholder]::before,
  [contenteditable] [data-placeholder]::before {
    color: #3E8A52 !important;
    opacity: 1 !important;
    font-family: var(--ph-mono) !important;
    font-style: normal !important;
  }

  /* ==== 7. YOUR messages — a prompt, not a bubble ====================
   *
   *  The whole theme is in this section.
   *
   *  Everything that made it a bubble is removed: fill, border, radius,
   *  padding, shadow. What replaces it is a single pseudo-element in the
   *  gutter carrying a bright green ">", and a left indent equal to its
   *  own width, so wrapped lines hang under each other exactly the way
   *  real terminal output wraps rather than tucking back under the
   *  prompt.
   *
   *  The glow on the ">" is allowed because it is ONE CHARACTER. This is
   *  the same licence the caret gets and the same one body text is
   *  refused.
   *
   *  ALIGNMENT: claude.ai right-aligns your messages. A terminal cannot
   *  do that — the prompt column has to be fixed or it stops reading as
   *  a prompt. So the wrapper rows are pushed back to flex-start. This
   *  is the one rule in the file most likely to need a nudge if the app
   *  reshuffles its DOM, and it is deliberately spread across four
   *  ancestor depths for that reason.
   */

  /* clear the ancestor wrappers (the ghost rectangle) and un-right them.
     Do NOT touch overflow here. */
  div:has(> [data-testid="user-message"]),
  div:has(> div > [data-testid="user-message"]),
  div:has(> div > div > [data-testid="user-message"]),
  div:has(> div > div > div > [data-testid="user-message"]) {
    background: transparent !important;
    background-color: transparent !important;
    border-color: transparent !important;
    box-shadow: none !important;
    justify-content: flex-start !important;
    align-items: flex-start !important;
    margin-left: 0 !important;
    margin-right: auto !important;
  }
  div:has([data-testid="user-message"])::before,
  div:has([data-testid="user-message"])::after {
    background: transparent !important;
    box-shadow: none !important;
  }

  [data-testid="user-message"] {
    position: relative !important;
    background: transparent !important;
    background-image: none !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    color: #CFFFDD !important;
    padding: 0 0 0 1.45em !important;
    margin-left: 0 !important;
    margin-right: auto !important;
    max-width: 100% !important;
  }

  /* the prompt */
  [data-testid="user-message"]::before {
    content: '>';
    position: absolute;
    left: 0.05em;
    top: 0;
    font-family: var(--ph-mono);
    font-weight: 700;
    color: #00FF41;
    line-height: inherit;
    text-shadow:
      0 0 6px rgba(0, 255, 65, 0.85),
      0 0 16px rgba(0, 255, 65, 0.40);
    pointer-events: none;
  }

  [data-testid="user-message"] :is(p, li, span, div) {
    color: #CFFFDD !important;
  }

  /* mono everywhere, and a touch tighter than Ink's serif wanted —
     monospace runs wide, so it needs less leading, not more */
  [data-testid="user-message"],
  [data-testid="user-message"] :is(p, li, span, div, strong, b, em, i, del, blockquote) {
    font-family: var(--ph-mono) !important;
  }
  [data-testid="user-message"] :is(p, li, blockquote) {
    font-size: 0.94em !important;
    line-height: 1.62 !important;
  }

  /* ==== 7b. The collapse fade ======================================== *
   * With no bubble to fade INTO, the "Show more" overlay has to run to
   * the page colour. Two ways in: the Tailwind-ish hooks, plus the
   * .ph-fade tag applied by the fade-hunter in the JS.                 */

  [data-testid="user-message"] .ph-fade,
  [data-testid="user-message"] [class*="to-bg-"],
  [data-testid="user-message"] [class*="from-bg-"],
  [data-testid="user-message"] [class*="bg-gradient"] {
    background-color: transparent !important;
    background-image: linear-gradient(to bottom,
      rgba(4, 6, 4, 0)    0%,
      rgba(4, 6, 4, 0.74) 42%,
      rgba(4, 6, 4, 0.96) 78%,
      #040604             100%) !important;
  }

  /* "Show more" / "Show less" — a control, so it gets the phosphor */
  [data-testid="user-message"] .ph-fade + *,
  div:has(> [data-testid="user-message"]) button {
    color: #00FF41 !important;
    font-family: var(--ph-mono) !important;
  }

  /* ==== 8. Claude's messages — output ================================
   * No container. No frame. No fill. Just text running down the tube.
   *
   * The body mint is #86E9A2 rather than #00FF41, and that gap is the
   * most important colour decision in the file. Pure phosphor body copy
   * at any real length is genuinely unpleasant to read — the saturation
   * fights the black hard enough that the letters appear to buzz. The
   * mint keeps the hue and gives back the lightness.
   *
   * And no, nothing is uppercased. Terminals were never all caps by
   * choice; early ones were all caps because the character ROM had no
   * room for lowercase. Reproducing a hardware limitation as an
   * aesthetic is how you end up with a theme you can't read.          */

  .font-claude-message,
  .font-claude-response,
  [data-testid="assistant-message"] {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }

  body :is(p, li, blockquote, td, th, figcaption, summary):not(pre *):not(code):not(code *) {
    color: #86E9A2 !important;
    font-family: var(--ph-mono) !important;
  }
  body :is(p, li, blockquote):not(pre *):not(code *) {
    font-size: 0.94em !important;
    line-height: 1.66 !important;
  }
  body :is(h1, h2, h3, h4, h5, h6, strong, b):not(pre *):not(code *) {
    color: #CFFFDD !important;
    font-family: var(--ph-mono) !important;
    letter-spacing: 0.01em !important;
  }

  /* the prompt line keeps its own brighter colour — the two rules above
     are document-wide and would otherwise repaint your messages */
  [data-testid="user-message"] :is(p, li, blockquote, td, th, summary),
  [data-testid="user-message"] :is(h1, h2, h3, h4, h5, h6, strong, b) {
    color: #CFFFDD !important;
  }

  /* Italic action text. This is the ONE place body-adjacent text is
     allowed a bloom, and only because these runs are three or four words
     long. A glow on a phrase is a highlight; a glow on a paragraph is a
     smear. If a long italic block ever shows up it will look soft, and
     that is a trade I am making on purpose. */
  .font-claude-message :is(em, i),
  .font-claude-response :is(em, i),
  [data-testid="assistant-message"] :is(em, i) {
    color: #00FF41 !important;
    font-style: italic !important;
    text-shadow:
      0 0 7px rgba(0, 255, 65, 0.42),
      0 0 16px rgba(0, 255, 65, 0.18) !important;
  }

  /* ==== 8b. The block cursor ========================================= *
   * A thick phosphor block at the end of the LAST reply only, blinking.
   *
   * Last one only, deliberately. One cursor at the bottom of the page
   * reads as a terminal sitting there waiting — quietly alive. Fifteen
   * of them blinking down a long scroll reads as a page full of errors,
   * and it is the same trap as Matrix rain: one blinking element is
   * free, fifteen is a battery tax for nothing.
   *
   * It rides the last PARAGRAPH rather than the message container, so it
   * sits inline after the final full stop instead of dropping onto its
   * own line. caretize() below does the tagging. Because it re-tags as
   * the reply streams, it genuinely does look like it is typing.
   *
   * steps(1) so opacity never interpolates — a hard on/off is both what
   * a real cursor does and marginally cheaper than a fade.            */

  .ph-caret::after {
    content: '';
    display: inline-block;
    width: 0.56em;
    height: 1.0em;
    margin-left: 0.16em;
    vertical-align: -0.14em;
    background: #00FF41;
    box-shadow:
      0 0 8px rgba(0, 255, 65, 0.7),
      0 0 20px rgba(0, 255, 65, 0.3);
    animation: phBlink 1.06s steps(1) infinite;
  }

  @keyframes phBlink {
    0%, 49%   { opacity: 1; }
    50%, 100% { opacity: 0; }
  }

  /* ==== 9. Quiet text stays quiet (thinking block, timestamps) ======= */
  body :is(p, li, span, div, summary):is([class*="text-text-3"], [class*="text-text-4"], [class*="text-text-5"]):not(pre *):not(code *),
  body :is([class*="text-text-3"], [class*="text-text-4"], [class*="text-text-5"]) :is(p, li, span, div):not(pre *):not(code *) {
    color: #5CBE77 !important;
  }
  div[class*="grid-template-rows"] :is(p, li, span, div):not(pre *):not(code *),
  div[class*="grid-template-rows"] svg {
    color: #5CBE77 !important;
  }
  div[class*="grid-template-rows"] * {
    border-color: rgba(0, 255, 65, 0.16) !important;
  }

  /* ==== 9b. The sidebar ==============================================
   * Same discipline Ink arrived at, different colours: rows are the mint,
   * and the pure phosphor is reserved for the row you are actually on.
   * A whole navigation list in #00FF41 spends the accent on furniture,
   * and once the bright green is ordinary it stops meaning anything.  */

  nav :is(a, a span, a div, button span),
  aside :is(a, a span, a div, button span),
  [class*="sidebar"] :is(a, a span, a div, button span) {
    color: #86E9A2 !important;
  }
  nav :is(a, a span, a div, button span):not([data-ph-glyph]),
  aside :is(a, a span, a div, button span):not([data-ph-glyph]),
  [class*="sidebar"] :is(a, a span, a div, button span):not([data-ph-glyph]) {
    font-family: var(--ph-mono) !important;
  }

  /* icons DO get the pure phosphor everywhere, per the brief. They are
     small stroked shapes rather than runs of text, so saturation reads
     as accent rather than as noise. claude.ai draws them with
     stroke="currentColor", so this is just a colour on the ancestor. */
  nav svg,
  aside svg,
  [class*="sidebar"] svg,
  header svg,
  fieldset svg {
    color: #00FF41 !important;
  }

  nav :is(a[aria-current], a[data-active="true"], [aria-selected="true"]),
  nav :is(a[aria-current], a[data-active="true"], [aria-selected="true"]) :is(span, div, svg),
  aside :is(a[aria-current], a[data-active="true"], [aria-selected="true"]),
  aside :is(a[aria-current], a[data-active="true"], [aria-selected="true"]) :is(span, div, svg),
  nav a:hover, nav a:hover :is(span, div, svg),
  aside a:hover, aside a:hover :is(span, div, svg) {
    color: #00FF41 !important;
    text-shadow: 0 0 8px rgba(0, 255, 65, 0.35) !important;
  }

  /* ==== 10. Buttons & icons ========================================== */
  button:not([aria-label*="Send" i]):not([type="submit"]),
  button:not([aria-label*="Send" i]):not([type="submit"]) :is(span, div, p) {
    color: #86E9A2 !important;
  }
  button:not([aria-label*="Send" i]):not([type="submit"]):not([data-ph-glyph]),
  button:not([aria-label*="Send" i]):not([type="submit"]) :is(span, div, p):not([data-ph-glyph]) {
    font-family: var(--ph-mono) !important;
  }
  button:not([aria-label*="Send" i]):not([type="submit"]) svg {
    color: #00FF41 !important;
  }

  /* ==== 11. Ambience =================================================
   * Selection is INVERSE VIDEO — solid phosphor block, black text. This
   * is free, it is exactly right, and it is the detail people will
   * notice without being able to say why.                             */
  ::selection {
    background: #00FF41;
    color: #030503;
  }
  ::-webkit-scrollbar { width: 7px; height: 7px; }
  ::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 65, 0.30);
    border-radius: 0;
  }
  ::-webkit-scrollbar-track { background: transparent; }

  /* code blocks need to differ from body text that is ALREADY mono, so
     they are distinguished by their box rather than by their face */
  pre, code {
    background-color: rgba(0, 255, 65, 0.055) !important;
    border-radius: 2px !important;
    font-family: var(--ph-mono) !important;
  }
  pre {
    border: 1px solid rgba(0, 255, 65, 0.24) !important;
  }
  code, pre code {
    color: #B6FFCB !important;
  }

  hr {
    border-color: rgba(0, 255, 65, 0.26) !important;
  }

  a:not(button) {
    color: #00FF41 !important;
    text-decoration-color: rgba(0, 255, 65, 0.45) !important;
  }

  /* ==== 12. Markdown bloom clothes ===================================
   * The JS below repaints YOUR sent messages (display-only) so bold,
   * italics, inline code, headers, strikes and dividers render. Headers
   * stay mono — there is no other face in this theme to escape to, so
   * they earn their weight from size and letter-spacing instead.      */
  [data-testid="user-message"] strong { font-weight: 700 !important; color: #E6FFEE !important; }
  [data-testid="user-message"] em     { font-style: italic !important; color: #00FF41 !important; }
  [data-testid="user-message"] del    { opacity: 0.5; }
  [data-testid="user-message"] code.ph-code {
    font-family: var(--ph-mono) !important;
    font-size: 0.9em !important;
    background-color: rgba(0, 255, 65, 0.10) !important;
    color: #B6FFCB !important;
    border: 1px solid rgba(0, 255, 65, 0.28) !important;
    border-radius: 2px !important;
    padding: 0.05rem 0.32rem !important;
  }
  [data-testid="user-message"] p.ph-h1 { font-size: 1.24em !important; font-weight: 700 !important; color: #E6FFEE !important; letter-spacing: 0.045em !important; }
  [data-testid="user-message"] p.ph-h2 { font-size: 1.12em !important; font-weight: 700 !important; color: #E6FFEE !important; letter-spacing: 0.03em !important; }
  [data-testid="user-message"] p.ph-h3 { font-size: 1.02em !important; font-weight: 700 !important; color: #CFFFDD !important; letter-spacing: 0.02em !important; }
  [data-testid="user-message"] p.ph-hr {
    border-top: 1px solid rgba(0, 255, 65, 0.34) !important;
    height: 0 !important;
    margin: 0.7rem 0 !important;
    overflow: hidden !important;
  }

  /* ==== 14. ICONS — the visibility pass ==============================
   *
   *  v1.1.0. This section exists because five separate things went
   *  missing in v1.0.0 — sidebar row icons, the top bar's drawer toggle
   *  and chevrons, the composer's attach and model-picker glyphs, and
   *  the copy / regenerate buttons under a message — and they all went
   *  missing for the same reason.
   *
   *  THE DIAGNOSIS
   *  Setting "color" on an SVG only reaches the parts of it that were
   *  drawn with currentColor. claude.ai has two families of icon: the
   *  outline ones, which declare stroke="currentColor" and follow the
   *  text colour obediently, and a set of solid ones that declare no
   *  paint at all and simply inherit fill from the document. On every
   *  light theme in this set, and on claude.ai's own dark mode, the
   *  inherited fill happened to land somewhere visible. On a page this
   *  black it landed on black. They were never mis-coloured; they were
   *  filled in with the background.
   *
   *  So the fix is in two halves: force the colour (which was already
   *  right, and is repeated here at higher specificity so nothing
   *  upstream can undo it), and hand back a fill to the shapes that
   *  never had one.
   *
   *  THE BRAND-MARK CAVEAT
   *  The second half is scoped with :not([fill]):not([stroke]), which
   *  is doing real work: the Drive triangle, the Gmail M and the
   *  Anthropic starburst all declare their own colours on every shape
   *  they own, so this rule cannot see them and they keep their proper
   *  colours. The svg:not([fill="none"]) guard does the same job at the
   *  root, keeping outline icons from being flood-filled into blobs.
   *
   *  IF SOMETHING TURNS INTO A GREEN BLOB, it is one of these two fill
   *  rules and nothing else in the file. Delete the offending rule and
   *  everything else keeps working.                                   */

  :is(nav, aside, header, fieldset, [class*="sidebar"], [role="dialog"], [role="menu"]) svg,
  button svg,
  [role="button"] svg,
  a svg {
    color: #00FF41 !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  /* --- half one: shapes that use currentColor, made sure of --- */
  svg [fill="currentColor"]  { fill: currentColor !important; }
  svg [stroke="currentColor"] { stroke: currentColor !important; }

  /* sprite icons pull their shapes in through <use>, which the shape
     selectors above cannot see into. Paint the reference itself. */
  svg use { fill: currentColor !important; }

  /* --- half two: shapes with no paint of their own, given one --- */
  :is(nav, aside, header, fieldset, [class*="sidebar"], button, [role="button"], a)
    svg:not([fill]):not([stroke]):not([fill="none"])
    :is(path, circle, rect, ellipse, polygon, polyline):not([fill]):not([stroke]) {
    fill: currentColor !important;
  }

  /* the send / stop key is the one place a phosphor icon would be
     invisible for the opposite reason — green on green. Its glyph goes
     dark, and outranks the rule above by specificity. */
  button[aria-label*="send" i] svg,
  button[aria-label*="stop" i] svg,
  fieldset button[type="submit"] svg,
  button[aria-label*="send" i] svg :is(path, circle, rect, polygon, polyline),
  button[aria-label*="stop" i] svg :is(path, circle, rect, polygon, polyline),
  fieldset button[type="submit"] svg :is(path, circle, rect, polygon, polyline) {
    color: #021004 !important;
  }

  /* the message action row (copy, regenerate, edit) sits outside every
     container named above, so it gets its own line. Muted by default
     because it is chrome, phosphor on press because it is a control. */
  [data-testid="user-message"] ~ * button svg,
  div:has(> [data-testid="user-message"]) ~ div button svg,
  .font-claude-message ~ * button svg,
  [data-testid="assistant-message"] ~ * button svg {
    color: #5FC77E !important;
  }
  [data-testid="user-message"] ~ * button:hover svg,
  .font-claude-message ~ * button:hover svg,
  [data-testid="assistant-message"] ~ * button:hover svg {
    color: #00FF41 !important;
  }

  /* New chat's circle was a dark disc with an invisible + in it. Now it
     is a proper key: hairline box, phosphor glyph. */
  nav button:has(svg):first-of-type,
  nav a:has(svg) > span:first-child:empty {
    border-radius: 2px !important;
  }

  /* ==== 13. Reduced motion ===========================================
   * The cursor stops blinking but stays visible. Removing it entirely
   * would take the "waiting for input" reading away from people who are
   * only asking for less movement, not less meaning.                  */
  @media (prefers-reduced-motion: reduce) {
    .ph-caret::after { animation: none; opacity: 1; }
  }
  `;

  /* ------------------------------------------------------------------ *
   *  Injection
   * ------------------------------------------------------------------ */

  const STYLE_ID = 'phosphor-style';
  const CRT_ID   = 'ph-crt';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = THEME_CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  /* ------------------------------------------------------------------ *
   *  THE DOCKER  (carried over verbatim, ic- -> ph-)
   *
   *  The "Claude is AI and can make mistakes" line has no stable class,
   *  id or aria-label, so we find it by its wording — once — and tag it.
   *  From there we walk up a few levels to the container that also holds
   *  the composer, and tag that as the dock so CSS can paint its fade.
   * ------------------------------------------------------------------ */

  function docker() {
    if (document.querySelector('.ph-dock')) return;
    try {
      let best = null;
      for (const el of document.querySelectorAll('div, p, span')) {
        const t = el.textContent;
        if (!t || t.length > 140) continue;
        if (!/can make mistakes/i.test(t)) continue;
        if (!best || t.length < best.textContent.length) best = el;
      }
      if (!best) return;
      best.classList.add('ph-disclaimer');

      let p = best.parentElement;
      for (let i = 0; i < 5 && p; i++) {
        if (p.querySelector('fieldset')) {
          if (p.getBoundingClientRect().height < window.innerHeight * 0.5) {
            p.classList.add('ph-dock');
          }
          return;
        }
        p = p.parentElement;
      }
    } catch (e) { /* never break the page over a disclaimer */ }
  }

  function buildCrt() {
    if (!document.body || document.getElementById(CRT_ID)) return;
    const crt = document.createElement('div');
    crt.id = CRT_ID;
    crt.setAttribute('aria-hidden', 'true');
    document.body.prepend(crt);
  }

  injectStyle();

  /* ------------------------------------------------------------------ *
   *  THE CARET
   *
   *  Finds the last assistant message, finds the last block of text
   *  inside it, and tags that one element .ph-caret. Everything visual
   *  is CSS; this only decides WHERE.
   *
   *  Cost control, because this is the one new moving part in the theme:
   *    · throttled to 140ms, so a streaming reply that fires hundreds of
   *      mutations does a handful of passes per second instead
   *    · exits immediately if the element it would tag is already tagged,
   *      which is the case for the overwhelming majority of calls
   *    · querySelectorAll is scoped to ONE message, never the document
   *  At idle it is a single querySelector that finds nothing new.
   * ------------------------------------------------------------------ */

  const MSG_SEL = '.font-claude-message, .font-claude-response, [data-testid="assistant-message"]';
  const BLOCK_SEL = 'p, li, h1, h2, h3, h4, h5, h6, blockquote, td';
  let lastCaretRun = 0;

  function caretize(force) {
    const now = Date.now();
    if (!force && now - lastCaretRun < 140) return;
    lastCaretRun = now;
    try {
      const msgs = document.querySelectorAll(MSG_SEL);
      if (!msgs.length) return;
      const last = msgs[msgs.length - 1];

      /* last text block that actually has text in it — trailing empty
         paragraphs are common mid-stream */
      const blocks = last.querySelectorAll(BLOCK_SEL);
      let target = null;
      for (let i = blocks.length - 1; i >= 0; i--) {
        const t = blocks[i].textContent;
        if (t && t.trim().length) { target = blocks[i]; break; }
      }
      if (!target) return;
      if (target.classList.contains('ph-caret')) return;

      const prev = document.querySelector('.ph-caret');
      if (prev) prev.classList.remove('ph-caret');
      target.classList.add('ph-caret');
    } catch (e) { /* a cursor is not worth breaking a page over */ }
  }

  /* ------------------------------------------------------------------ *
   *  THE ICON PASS
   *
   *  This is here because CSS could not do it, and it is worth saying
   *  exactly why rather than just shipping the workaround.
   *
   *  Setting "color" on an icon only reaches the parts of it drawn with
   *  currentColor. claude.ai draws its icons three different ways —
   *  OUTLINE icons (fill="none", stroke="currentColor"), SOLID icons
   *  (shapes with no paint attribute at all, inheriting fill from the
   *  document), and a few MASKED ones (a coloured box seen through a
   *  mask-image). Each one needs a different property set, and CSS has
   *  no way to ask an element which kind it is. So two rounds of
   *  increasingly baroque selectors fixed some and missed others.
   *
   *  JS can just look. For each icon it works out the family from the
   *  element's own attributes and writes the right paint back as an
   *  INLINE style with !important priority — which outranks every
   *  stylesheet in the document, claude.ai's included. It no longer
   *  matters what container an icon is in, which was the thing my
   *  selectors kept getting wrong.
   *
   *  WHAT IT REFUSES TO TOUCH
   *  Anything that declares a literal colour, a gradient or an embedded
   *  image is not a monochrome UI icon — that is the Drive triangle,
   *  the Gmail M, the Anthropic starburst — and the function returns
   *  before writing anything. Those keep their real colours.
   *
   *  COST
   *  Every element is inspected exactly once and flagged in its dataset;
   *  every later call exits on the first line. Throttled to 200ms on top
   *  of that. At idle this is one querySelectorAll that finds nothing
   *  new to do.
   * ------------------------------------------------------------------ */

  const PHOS = '#00FF41';
  const SHAPE_SEL = 'path, circle, rect, ellipse, polygon, polyline, line, use';
  const KEY_SEL = 'button[aria-label*="send" i], button[aria-label*="stop" i], fieldset button[type="submit"]';
  let lastIconRun = 0;

  /* How many distinct paints does this icon actually use? Computed
     styles rather than attributes, which matters twice over: it sees
     fills applied by claude.ai's stylesheets that never appear in the
     markup, and it resolves currentColor to whatever it currently is —
     and if that resolves to something dark, dark is the truth we need
     to know about. Gradients and url() paints count as multicolour by
     definition. */
  function countPaints(svg, shapes) {
    const paints = new Set();
    const add = (v) => {
      if (!v) return;
      const t = String(v).trim().toLowerCase();
      if (!t || t === 'none' || t === 'transparent') return;
      if (/^rgba\(.+,\s*0\)$/.test(t)) return;   /* fully transparent */
      if (t.startsWith('url')) { paints.add('url'); paints.add('url2'); return; }
      paints.add(t);
    };
    try {
      if (shapes.length) {
        for (const sh of shapes) {
          const cs = getComputedStyle(sh);
          add(cs.fill); add(cs.stroke);
          if (paints.size > 1) break;
        }
      } else {
        const cs = getComputedStyle(svg);
        add(cs.fill); add(cs.stroke);
      }
    } catch (e) { /* treat unreadable as multicolour: safer to skip */ return 2; }
    return paints.size;
  }

  function paintIcon(svg) {
    if (svg.dataset.phIcon) return;
    svg.dataset.phIcon = '1';
    try {
      /* the send / stop key wants a DARK glyph on its phosphor block,
         and CSS already handles it. Leave it alone. */
      if (svg.closest && svg.closest(KEY_SEL)) return;

      /* real artwork: hands off unconditionally */
      if (svg.querySelector('image')) return;

      const shapes = svg.querySelectorAll(SHAPE_SEL);

      /* THE DISCRIMINATOR. One paint = a monochrome UI glyph, whatever
         colour it declares and however it declares it — repaint it.
         Two or more = the Drive triangle, the Gmail M, anything with
         actual art direction — leave it exactly alone. This replaces
         v1.2.0's "never touch a literal colour" rule, which turned out
         to be protecting the broken icons: claude.ai bakes literal
         dark fills into its chrome glyphs. */
      if (countPaints(svg, shapes) > 1) return;

      svg.style.setProperty('color', PHOS, 'important');

      if (!shapes.length) {
        /* a sprite reference or similar — no shapes to visit, so the
           paint goes on the root and cascades into whatever <use>
           pulls in. v1.2.0 returned here without painting, which is
           one of the two ways icons stayed dark. */
        svg.style.setProperty('fill', PHOS, 'important');
        svg.style.setProperty('stroke', 'currentColor', 'important');
        return;
      }

      for (const sh of shapes) {
        let f = 'currentcolor', k = 'none';
        try {
          const cs = getComputedStyle(sh);
          f = (cs.fill || '').toLowerCase();
          k = (cs.stroke || '').toLowerCase();
        } catch (e) { /* fall through with defaults */ }
        if (k && k !== 'none') sh.style.setProperty('stroke', 'currentColor', 'important');
        if (f && f !== 'none') sh.style.setProperty('fill', 'currentColor', 'important');
      }
    } catch (e) { /* an icon is not worth breaking a page over */ }
  }

  /* Masked icons and picture icons: an empty box coloured through a
     mask-image cutout, or — worse — an icon that is literally a picture
     painted in as a background-image. A picture cannot be recoloured,
     but it CAN be repurposed: use the same image as a mask instead, and
     pour phosphor through its own silhouette. Size-gated so a genuine
     decorative background can never be mistaken for an icon. */
  function paintMask(el) {
    if (el.dataset.phMask) return;
    el.dataset.phMask = '1';
    try {
      if (el.childElementCount !== 0) return;
      if ((el.textContent || '').trim().length > 2) return;
      const cs = getComputedStyle(el);
      const m = cs.maskImage || cs.webkitMaskImage || 'none';
      if (m && m !== 'none') {
        el.style.setProperty('background-color', PHOS, 'important');
        el.style.setProperty('background-image', 'none', 'important');
        return;
      }
      const bi = cs.backgroundImage || 'none';
      if (bi.indexOf('url(') === 0) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) {
          /* hidden right now (closed drawer) — let a later pass retry */
          delete el.dataset.phMask;
          return;
        }
        if (r.width <= 48 && r.height <= 48) {
          el.style.setProperty('-webkit-mask-image', bi, 'important');
          el.style.setProperty('mask-image', bi, 'important');
          el.style.setProperty('-webkit-mask-size', 'contain', 'important');
          el.style.setProperty('mask-size', 'contain', 'important');
          el.style.setProperty('-webkit-mask-repeat', 'no-repeat', 'important');
          el.style.setProperty('mask-repeat', 'no-repeat', 'important');
          el.style.setProperty('-webkit-mask-position', 'center', 'important');
          el.style.setProperty('mask-position', 'center', 'important');
          el.style.setProperty('background-image', 'none', 'important');
          el.style.setProperty('background-color', PHOS, 'important');
        }
      }
    } catch (e) { /* ditto */ }
  }

  const MASK_SEL = ':is(nav, aside, header, fieldset, [class*="sidebar"], button, [role="button"], a) :is(span, i, div)';

  /* ---- verify: the pass that does not guess ------------------------- *
   * Everything above works out how an icon was AUTHORED, and authoring
   * is exactly what I have now been wrong about three times. This pass
   * only cares what the browser is about to DRAW. After painting, it
   * reads the COMPUTED fill, stroke and color of every shape, and any
   * paint that resolves to near-black — invisible on this page, no
   * matter what put it there — becomes phosphor. Sprite, mixed icon,
   * baked-in literal, stylesheet fill, inherited default: it cannot
   * tell them apart and does not need to.
   *
   * It cannot break a brand mark, because nothing branded on this page
   * paints in near-black — the Drive triangle, the Gmail M and the
   * starburst are all saturated colours that sail over the threshold.
   * The one deliberately dark glyph (inside the send key) is excluded
   * along with everything else in KEY_SEL. Once per element, flagged in
   * the dataset like the rest.                                        */

  function nearBlack(v) {
    const m = /^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(String(v || ''));
    if (!m) return false;
    /* darker than #404040 in every channel = invisible on this page */
    return Math.max(+m[1], +m[2], +m[3]) < 64;
  }

  function verify(svg) {
    if (svg.dataset.phVer) return;
    svg.dataset.phVer = '1';
    try {
      if (svg.closest && svg.closest(KEY_SEL)) return;
      const shapes = svg.querySelectorAll(SHAPE_SEL);
      const list = shapes.length ? shapes : [svg];
      for (const sh of list) {
        const cs = getComputedStyle(sh);
        if (nearBlack(cs.fill))   sh.style.setProperty('fill', PHOS, 'important');
        if (nearBlack(cs.stroke)) sh.style.setProperty('stroke', PHOS, 'important');
        if (nearBlack(cs.color))  sh.style.setProperty('color', PHOS, 'important');
      }
    } catch (e) { /* ditto */ }
  }

  /* ---- tagGlyphs: protect the icon FONT ------------------------------ *
   * Some claude.ai icons are not drawings at all — they are one special
   * character in a span, rendered by an icon font. A character in the
   * Unicode private-use area (U+E000–U+F8FF, or the supplementary
   * planes) has no meaning outside the font that defines it, which
   * makes it the unmistakable signature of an icon glyph: no real text
   * ever lives there.
   *
   * These elements get data-ph-glyph, and every chrome font-family rule
   * in the CSS carries :not([data-ph-glyph]) — so the icon font keeps
   * its job and the glyph keeps existing. The glyph is then painted
   * phosphor inline so it joins the theme like everything else.
   *
   * The one subtlety: an element that is EMPTY today is not flagged as
   * seen, because icon spans are often born empty and given their
   * character a frame later. Empty means "come back", not "not a
   * glyph".                                                           */

  const GLYPH_SCOPE = ':is(nav, aside, header, fieldset, [class*="sidebar"], button, [role="button"], a) :is(span, i, b, div)';

  function isPua(cp) {
    return (cp >= 0xE000 && cp <= 0xF8FF) || cp >= 0xF0000;
  }

  function tagGlyphs() {
    try {
      for (const el of document.querySelectorAll(GLYPH_SCOPE)) {
        if (el.dataset.phGlyphSeen) continue;
        if (el.childElementCount) { el.dataset.phGlyphSeen = '1'; continue; }
        const t = (el.textContent || '').trim();
        if (!t) continue; /* born empty — re-check on a later pass */
        el.dataset.phGlyphSeen = '1';
        const cps = [...t];
        if (cps.length > 2) continue;
        if (!cps.every((c) => isPua(c.codePointAt(0)))) continue;
        el.dataset.phGlyph = '1';
        el.style.setProperty('color', PHOS, 'important');
      }
    } catch (e) { /* ditto */ }
  }

  function iconize(force) {
    const now = Date.now();
    if (!force && now - lastIconRun < 200) return;
    lastIconRun = now;
    try {
      tagGlyphs();
      const svgs = document.querySelectorAll('svg');
      svgs.forEach(paintIcon);
      /* verify AFTER painting, same pass — inline styles land
         synchronously, so the computed values it reads are post-paint */
      svgs.forEach(verify);
      document.querySelectorAll(MASK_SEL).forEach(paintMask);
    } catch (e) { /* ditto */ }
  }

  /* ------------------------------------------------------------------ *
   *  MARKDOWN BLOOM  (carried over, classes renamed ic- -> ph-)
   *
   *  Display-only: we repaint the pixels of your sent messages, never
   *  the underlying text. Edit / copy / regenerate all read the app's
   *  own state, so the raw text keeps its asterisks. The composer is
   *  left alone on purpose — rewriting a live input risks cursor jumps.
   * ------------------------------------------------------------------ */

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function inlineMd(raw) {
    let s = esc(raw);
    s = s.replace(/\`([^\`]+)\`/g, '<code class="ph-code">$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*(\S(?:[^*\n]*\S)?)\*/g, '<em>$1</em>');
    s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    return s;
  }

  const MD_HINT = /(\*\*|\*[^*]|\`|~~|^#{1,3}\s|^\s*---\s*$)/;

  function processParagraph(p) {
    const raw = p.textContent;
    if (!MD_HINT.test(raw)) return;

    const trimmed = raw.trim();
    if (/^---+$/.test(trimmed)) {
      p.textContent = '';
      p.classList.add('ph-hr');
      return;
    }
    const h = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      p.innerHTML = inlineMd(h[2]);
      p.classList.add('ph-h' + h[1].length);
      return;
    }
    p.innerHTML = inlineMd(raw);
  }

  function processBubble(bubble) {
    if (bubble.dataset.phMd !== '1') {
      bubble.dataset.phMd = '1';
      bubble.querySelectorAll('p').forEach(processParagraph);
    }
    tagFades(bubble);
  }

  /* ---- fade-hunter -------------------------------------------------- *
   * The "Show more" fade overlay has no dependable class name, so we
   * find it by what it actually paints: any div inside a message whose
   * computed background-image is a gradient gets tagged .ph-fade, and
   * the CSS repaints it in page black. Each div is inspected exactly
   * once (data-ph-fade).                                               */

  function tagFades(bubble) {
    try {
      for (const el of bubble.querySelectorAll('div')) {
        if (el.dataset.phFade) continue;
        el.dataset.phFade = '1';
        const bg = getComputedStyle(el).backgroundImage || '';
        if (bg.indexOf('gradient') !== -1) el.classList.add('ph-fade');
      }
    } catch (e) { /* never break the page over a gradient */ }
  }

  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.matches && root.matches('[data-testid="user-message"]')) processBubble(root);
    root.querySelectorAll('[data-testid="user-message"]').forEach(processBubble);
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
    if (document.body && !document.getElementById(CRT_ID)) buildCrt();
    docker();
    caretize(false);
    iconize(false);
  });

  function boot() {
    injectStyle();
    buildCrt();
    docker();
    scan(document.documentElement);
    caretize(true);
    iconize(true);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

    /* burst pass: claude.ai builds its chrome after load, so look for the
       disclaimer and the last reply a few times early rather than
       waiting on a mutation */
    let bursts = 0;
    const burst = setInterval(() => {
      docker();
      caretize(true);
      iconize(true);
      if (++bursts >= 20) clearInterval(burst);
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
