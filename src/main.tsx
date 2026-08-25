import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import forMaskUrl from "./assets/for-mask.png";
import markMaskUrl from "./assets/mark-mask.png";

const FONT_STACK = 'Anton, "Arial Narrow", sans-serif';

type Scheme = {
  id: string;
  label: string;
  bg: string;
  accent: string;
  text: string;
  swatchBorder: string;
};

const SCHEMES: Scheme[] = [
  { id: "navy-red", label: "Navy / Red", bg: "#202250", accent: "#d62429", text: "#fbf3e7", swatchBorder: "#111433" },
  { id: "cream-red", label: "Cream / Red", bg: "#fbf3e7", accent: "#d62429", text: "#202250", swatchBorder: "#ded8ca" },
  { id: "navy-gold", label: "Navy / Gold", bg: "#202250", accent: "#cda36f", text: "#fbf3e7", swatchBorder: "#111433" }
];

type FormatPreset = {
  id: string;
  label: string;
  hint: string;
  width: number;
  height: number;
};

const FORMATS: FormatPreset[] = [
  { id: "square", label: "Social square", hint: "1080 × 1080 · Instagram/Facebook post", width: 1080, height: 1080 },
  { id: "story", label: "Story", hint: "1080 × 1920 · Instagram/Facebook story", width: 1080, height: 1920 },
  { id: "yard", label: "Yard sign", hint: "2000 × 1500 · print-ready 4:3", width: 2000, height: 1500 },
  { id: "banner", label: "Banner", hint: "2000 × 836 · cover photo / header", width: 2000, height: 836 }
];

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize = 10
): number {
  let lo = minSize;
  let hi = maxSize;
  let best = minSize;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    ctx.font = `400 ${mid}px ${FONT_STACK}`;
    if (ctx.measureText(text).width <= maxWidth) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

function bestTwoLineSplit(ctx: CanvasRenderingContext2D, words: string[]): [string, string] {
  let best: [string, string] = [words[0], words.slice(1).join(" ")];
  let bestWorstWidth = Infinity;
  ctx.font = `400 100px ${FONT_STACK}`;
  for (let split = 1; split < words.length; split++) {
    const line1 = words.slice(0, split).join(" ");
    const line2 = words.slice(split).join(" ");
    const worst = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width);
    if (worst < bestWorstWidth) {
      bestWorstWidth = worst;
      best = [line1, line2];
    }
  }
  return best;
}

/**
 * Anton's cap-height as a fraction of its em size — measured directly (rendered "ABDUL"
 * at 400px, scanned the actual ink bounds: cap-top sat 347px above the baseline). Every
 * word here is set in caps with no descenders, so this converts between "font size" and
 * the real glyph height used for stacking/centering math below. Getting this wrong is
 * what causes text to overshoot its intended box and crowd the row below it.
 */
const CAP_RATIO = 0.868;

/** Fits the group name as one line or a balanced two-line wrap, whichever renders bigger. */
function fitGroupName(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  maxWidth: number,
  budgetHeight: number
): { lines: string[]; fontSize: number } {
  const text = rawText.trim().toUpperCase() || "YOUR GROUP";
  const words = text.split(/\s+/);
  // Generous caps — real signs size the group name by available WIDTH (same as ABDUL
  // below it), not by a tight height ceiling. A low height cap was previously the
  // binding constraint for short one-word names, leaving them much smaller than ABDUL.
  const maxOneLineSize = budgetHeight * 1.2;
  const maxTwoLineSize = budgetHeight * 0.66;

  const oneLineSize = fitFontSize(ctx, text, maxWidth, maxOneLineSize);
  if (words.length < 2) return { lines: [text], fontSize: oneLineSize };

  const [line1, line2] = bestTwoLineSplit(ctx, words);
  const twoLineSize = Math.min(
    fitFontSize(ctx, line1, maxWidth, maxTwoLineSize),
    fitFontSize(ctx, line2, maxWidth, maxTwoLineSize)
  );

  return twoLineSize > oneLineSize * 1.05
    ? { lines: [line1, line2], fontSize: twoLineSize }
    : { lines: [text], fontSize: oneLineSize };
}

/**
 * The "FOR" + five-bar shield mark is a cropped, recolorable cutout of the actual source
 * artwork (extracted via per-pixel color decomposition, not redrawn) — hand-drawing this
 * lockup twice produced a close-but-not-quite shape. `for-mask.png` and `mark-mask.png`
 * share one crop's coordinate space (496x560), so drawing both at the same destination
 * rect reproduces the exact original lockup, just recolored per scheme.
 */
const MARK_ASPECT = 496 / 560;
/** Combined asset height as a fraction of ABDUL's own cap-height, measured from the source. */
const MARK_HEIGHT_RATIO = 0.749;
/** The asset's top edge, as a fraction of ABDUL's cap-height below ABDUL's own top — measured
 * from the source (FOR sits noticeably, but not fully, offset from ABDUL's cap-top). */
const MARK_TOP_OFFSET_RATIO = 0.131;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Recolors a white-on-transparent mask image onto an offscreen canvas. */
function tintMask(img: HTMLImageElement, color: string): HTMLCanvasElement {
  const off = document.createElement("canvas");
  off.width = img.naturalWidth;
  off.height = img.naturalHeight;
  const octx = off.getContext("2d")!;
  octx.drawImage(img, 0, 0);
  octx.globalCompositeOperation = "source-in";
  octx.fillStyle = color;
  octx.fillRect(0, 0, off.width, off.height);
  return off;
}

function drawSign(
  canvas: HTMLCanvasElement,
  format: FormatPreset,
  scheme: Scheme,
  groupName: string,
  marks: { forImg: HTMLImageElement; markImg: HTMLImageElement } | null
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = format;
  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = scheme.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.textBaseline = "alphabetic";

  // A generous width cap — actual rendered width is usually well under this, and
  // whatever it ends up being determines the centered block below (this is what
  // makes short one-word names sit centered with wide margins, and long two-line
  // names use nearly the full canvas, exactly like the reference artwork).
  const maxTextWidth = width * 0.86;

  // --- Group name (accent color), 1 or 2 lines, tight leading. ---
  const groupBudgetHeight = height * 0.3;
  const { lines, fontSize: groupFontSize } = fitGroupName(ctx, groupName, maxTextWidth, groupBudgetHeight);
  ctx.font = `400 ${groupFontSize}px ${FONT_STACK}`;
  const lineWidths = lines.map((line) => ctx.measureText(line).width);
  const groupCapHeight = groupFontSize * CAP_RATIO;
  const linePitch = groupFontSize * 0.86; // tight, near-touching leading, matching the source art
  const groupBlockHeight = groupCapHeight + (lines.length - 1) * linePitch;
  const groupBlockWidth = Math.max(...lineWidths);

  // --- The FOR + shield mark + ABDUL row. The mark asset's width (derived from ABDUL's
  // own cap-height) reserves the left column; two passes converge that against ABDUL's
  // width fit, same reasoning as the old text-based version. ---
  const columnGap = width * 0.025;
  let abdulFontSize = fitFontSize(ctx, "ABDUL", maxTextWidth * 0.7, height * 0.34);
  let columnWidth = 0;
  for (let pass = 0; pass < 2; pass++) {
    const assetHeight = abdulFontSize * CAP_RATIO * MARK_HEIGHT_RATIO;
    columnWidth = assetHeight * MARK_ASPECT;
    const abdulMaxWidth = maxTextWidth - columnWidth - columnGap;
    abdulFontSize = fitFontSize(ctx, "ABDUL", abdulMaxWidth, height * 0.34);
  }
  const abdulCapHeight = abdulFontSize * CAP_RATIO;
  const assetHeight = abdulCapHeight * MARK_HEIGHT_RATIO;
  const assetWidth = assetHeight * MARK_ASPECT;
  columnWidth = assetWidth;
  ctx.font = `400 ${abdulFontSize}px ${FONT_STACK}`;
  const abdulWidth = ctx.measureText("ABDUL").width;
  const rowWidth = columnWidth + columnGap + abdulWidth;
  const rowHeight = abdulCapHeight;

  // --- Center the whole (group name + row) block, both axes, like every reference sign. ---
  const blockGap = height * 0.0222; // measured from source art: group-name bottom to ABDUL's cap-top
  const blockWidth = Math.max(groupBlockWidth, rowWidth);
  const blockHeight = groupBlockHeight + blockGap + rowHeight;
  const blockLeft = (width - blockWidth) / 2;
  const blockTop = (height - blockHeight) / 2;

  ctx.fillStyle = scheme.accent;
  ctx.font = `400 ${groupFontSize}px ${FONT_STACK}`;
  lines.forEach((line, i) => {
    const baseline = blockTop + groupCapHeight + i * linePitch;
    ctx.fillText(line, blockLeft, baseline);
  });

  const rowTop = blockTop + groupBlockHeight + blockGap;
  const rowBaseline = rowTop + abdulCapHeight;

  // The mark asset is offset down from ABDUL's own cap-top, not bottom-aligned to the
  // baseline or top-aligned to ABDUL — matching the measured offset in the source art.
  if (marks) {
    const assetTop = rowTop + MARK_TOP_OFFSET_RATIO * abdulCapHeight;
    ctx.drawImage(tintMask(marks.markImg, scheme.accent), blockLeft, assetTop, assetWidth, assetHeight);
    ctx.drawImage(tintMask(marks.forImg, scheme.text), blockLeft, assetTop, assetWidth, assetHeight);
  }

  ctx.fillStyle = scheme.text;
  ctx.font = `400 ${abdulFontSize}px ${FONT_STACK}`;
  ctx.fillText("ABDUL", blockLeft + columnWidth + columnGap, rowBaseline);
}

function SignGenerator() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [groupName, setGroupName] = React.useState("Students");
  const [schemeId, setSchemeId] = React.useState(SCHEMES[0].id);
  const [formatId, setFormatId] = React.useState(FORMATS[0].id);
  const [fontsReady, setFontsReady] = React.useState(false);
  const marksRef = React.useRef<{ forImg: HTMLImageElement; markImg: HTMLImageElement } | null>(null);
  const [marksReady, setMarksReady] = React.useState(false);

  const scheme = SCHEMES.find((s) => s.id === schemeId) ?? SCHEMES[0];
  const format = FORMATS.find((f) => f.id === formatId) ?? FORMATS[0];

  React.useEffect(() => {
    let cancelled = false;
    document.fonts
      .load(`400 100px ${FONT_STACK}`)
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setFontsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([loadImage(forMaskUrl), loadImage(markMaskUrl)]).then(([forImg, markImg]) => {
      if (cancelled) return;
      marksRef.current = { forImg, markImg };
      setMarksReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawSign(canvas, format, scheme, groupName, marksRef.current);
  }, [format, scheme, groupName, fontsReady, marksReady]);

  const downloadPng = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const slug = (groupName.trim() || "your-group").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slug}-for-abdul.png`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [groupName]);

  return (
    <div className="generatorApp">
      <header className="generatorHeader">
        <p className="kicker">FREE &amp; SELF-SERVE</p>
        <h1>Make a Sign for Abdul</h1>
        <p className="lede">
          Type your group, pick a color scheme and a format, and download a "[Group] for Abdul" graphic
          in the campaign's colors — for yard signs, social posts, or print.
        </p>
      </header>

      <main className="generatorLayout">
        <section className="controls" aria-label="Sign options">
          <label className="field">
            <span>Group name</span>
            <input
              type="text"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="e.g. Van Buren County"
              maxLength={60}
              autoFocus
            />
          </label>

          <fieldset className="field">
            <legend>Color scheme</legend>
            <div className="swatchRow">
              {SCHEMES.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={option.id === schemeId ? "swatch active" : "swatch"}
                  style={{ background: option.bg, borderColor: option.swatchBorder }}
                  onClick={() => setSchemeId(option.id)}
                  aria-pressed={option.id === schemeId}
                  aria-label={option.label}
                >
                  <span style={{ background: option.accent }} />
                  <span style={{ background: option.text }} />
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="field">
            <legend>Format</legend>
            <div className="formatRow">
              {FORMATS.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={option.id === formatId ? "formatOption active" : "formatOption"}
                  onClick={() => setFormatId(option.id)}
                  aria-pressed={option.id === formatId}
                >
                  <strong>{option.label}</strong>
                  <span>{option.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <button type="button" className="downloadButton" onClick={downloadPng}>
            Download PNG
          </button>
        </section>

        <section className="previewPane" aria-label="Preview">
          <canvas ref={canvasRef} className="previewCanvas" style={{ aspectRatio: `${format.width} / ${format.height}` }} />
        </section>
      </main>

      <footer className="generatorFooter">
        Made by volunteers for Abdul El-Sayed for U.S. Senate. Nothing you type here is sent anywhere —
        your sign is generated entirely in your browser.
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("generator-root")!).render(
  <React.StrictMode>
    <SignGenerator />
  </React.StrictMode>
);
