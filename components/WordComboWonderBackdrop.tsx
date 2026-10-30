/**
 * A lightweight, decorative layer for the word-combo screen.
 * All motifs are inline SVG strokes; no images, canvas loops or timers.
 * Visibility and tempo come entirely from CSS and the existing combo level.
 */
export function WordComboWonderBackdrop() {
  return (
    <div className="word-combo-wonder" aria-hidden="true">
      <div className="word-combo-wonder-neon" />
      <div className="word-combo-wonder-surge" />
      <div className="word-combo-wonder-geometry">
        <svg className="word-combo-wonder-glyph is-hex" viewBox="0 0 160 160" fill="none">
          <path d="M80 10 141 45v70l-61 35-61-35V45Z" />
          <path d="M80 30 124 55v50l-44 25-44-25V55Z" opacity=".58" />
          <path d="M80 10v20m61 15-17 10m17 60-17-10m-44 45v-20m-61-15 17-10m-17-60 17 10" opacity=".75" />
          <circle cx="80" cy="80" r="7" /><path d="M52 80h17m22 0h17M80 52v17m0 22v17" opacity=".6" />
        </svg>
        <svg className="word-combo-wonder-glyph is-orbit" viewBox="0 0 160 160" fill="none">
          <circle cx="80" cy="80" r="63" strokeDasharray="136 45 75 140" />
          <circle cx="80" cy="80" r="45" strokeDasharray="54 18 98 112" opacity=".7" />
          <circle cx="80" cy="80" r="23" opacity=".45" />
          <path d="M80 2v23m0 110v23M2 80h23m110 0h23" /><path d="m33 33 12 12m70 70 12 12m0-94-12 12m-70 70-12 12" opacity=".6" />
          <circle cx="80" cy="17" r="4" fill="currentColor" stroke="none" />
        </svg>
        <svg className="word-combo-wonder-glyph is-diamond" viewBox="0 0 160 160" fill="none">
          <path d="m80 10 68 70-68 70L12 80Z" />
          <path d="m80 31 48 49-48 49-48-49Z" opacity=".65" />
          <path d="M80 31v98M32 80h96M80 10v21M12 80h20M148 80h-20M80 150v-21" opacity=".48" />
          <path d="m80 61 19 19-19 19-19-19Z" />
        </svg>
        <svg className="word-combo-wonder-glyph is-cube" viewBox="0 0 160 160" fill="none">
          <path d="m80 15 60 33v64l-60 33-60-33V48Z" />
          <path d="m20 48 60 34 60-34M80 82v63" />
          <path d="m49 64 31-17 31 17M49 96l31 17 31-17" opacity=".5" />
          <circle cx="80" cy="82" r="5" fill="currentColor" stroke="none" />
        </svg>
        <svg className="word-combo-wonder-glyph is-triangle" viewBox="0 0 160 160" fill="none">
          <path d="M80 12 150 138H10Z" />
          <path d="m80 43 43 77H37Z" opacity=".7" />
          <path d="m80 43-43 77m86 0L80 43M36 88h88" opacity=".48" />
          <circle cx="80" cy="88" r="8" /><path d="M80 12v30M10 138l25-15m115 15-25-15" opacity=".68" />
        </svg>
        <svg className="word-combo-wonder-glyph is-circuit" viewBox="0 0 160 160" fill="none">
          <path d="M30 30h48l22 22v32l30 30v20h-28l-29-29H38V75L18 55V30h12Z" />
          <path d="m78 30-13 24v24l33 33h32M38 75h27M18 55h20m35 50V78" opacity=".6" />
          <circle cx="78" cy="30" r="5" /><circle cx="130" cy="134" r="6" /><circle cx="38" cy="75" r="4" />
        </svg>
      </div>
    </div>
  );
}
