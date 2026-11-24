// Renders PNG images of the TC001 32x8 display for the README, using the drawing logic of the
// interactive preview page itself (graph-arrow-face.html), so the images and the page always match.
//   node docs/graph-arrow-face/render_png.mjs docs/graph-arrow-face/preview.html docs/graph-arrow-face
// (macOS: PNG conversion uses sips)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const [, , htmlPath, outDir] = process.argv;
const js = fs.readFileSync(htmlPath, "utf8").split("<script>")[1].split("</script>")[0];
const logic = js.slice(js.indexOf("const W = 32"), js.indexOf("  function draw("));
const data = js.slice(js.indexOf("  // Example data"), js.indexOf("  let spanHours"));
const { existingFace, proposedFace, scenarios, W, H } =
  new Function(logic + data + "\nreturn { existingFace, proposedFace, scenarios, W, H };")();

const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const BG = [17, 19, 22], OFF = [34, 37, 42];

// Paint frames (rows of 32x8 LEDs) stacked vertically, with an optional colored bar under a frame.
function paint(frames, cell = 20, gap = 18, pad = 16) {
  const w = W * cell + pad * 2;
  const h = frames.reduce((a, fr) => a + H * cell + (fr.bars ? 14 : 0), 0) + gap * (frames.length - 1) + pad * 2;
  const px = new Uint8Array(w * h * 3);
  for (let i = 0; i < w * h; i++) px.set(BG, i * 3);
  const blend = (x, y, rgb, a) => {
    if (x < 0 || y < 0 || x >= w || y >= h || a <= 0) return;
    const o = (y * w + x) * 3;
    for (let k = 0; k < 3; k++) px[o + k] = Math.round(px[o + k] * (1 - a) + rgb[k] * a);
  };
  let top = pad;
  for (const fr of frames) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = fr.f[y][x], rgb = c ? hex(c) : OFF;
      const cx = pad + x * cell + cell / 2, cy = top + y * cell + cell / 2, r = cell * 0.38;
      for (let yy = Math.floor(cy - cell); yy <= cy + cell; yy++) for (let xx = Math.floor(cx - cell); xx <= cx + cell; xx++) {
        const d = Math.hypot(xx + 0.5 - cx, yy + 0.5 - cy);
        if (c && d > r && d < r * 1.9) blend(xx, yy, rgb, 0.16 * (1 - (d - r) / (r * 0.9)));  // glow
        blend(xx, yy, rgb, Math.max(0, Math.min(1, r + 0.5 - d)));                             // anti-aliased dot
      }
    }
    top += H * cell;
    if (fr.bars) {
      for (const b of fr.bars) for (let yy = top + 6; yy < top + 10; yy++)
        for (let xx = pad + b.from * cell + 3; xx < pad + (b.to + 1) * cell - 3; xx++) blend(xx, yy, hex(b.color), 1);
      top += 14;
    }
    top += gap;
  }
  return { w, h, px };
}

function save(name, img) {
  const ppm = path.join(outDir, name + ".ppm");
  fs.writeFileSync(ppm, Buffer.concat([Buffer.from(`P6\n${img.w} ${img.h}\n255\n`), Buffer.from(img.px)]));
  execFileSync("sips", ["-s", "format", "png", ppm, "--out", path.join(outDir, name + ".png")], { stdio: "ignore" });
  fs.unlinkSync(ppm);
  console.log("wrote", name + ".png");
}

const byName = n => scenarios.find(s => s.name.startsWith(n));
const shots = [
  ["steady", "Steady"], ["rising", "Rising"], ["dropping", "Dropping"], ["urgent-low", "Urgent low"], ["old-data", "Reading is too old"],
];
for (const [file, name] of shots) save(file, paint([{ f: proposedFace(byName(name), 2).f }]));

// The layout: graph, value and arrow zones marked under the display.
const r = proposedFace(byName("Rising"), 2);
save("layout", paint([{ f: r.f, bars: [
  { from: 0, to: r.gw - 1, color: "#00ff00" },
  { from: r.valueX, to: r.valueX + r.tw - 1, color: "#ffff00" },
  { from: 27, to: 31, color: "#ffffff" },
] }]));

// Built-in "Graph and BG" (top) against the new face (bottom), same readings.
const s = byName("Rising");
save("compare", paint([{ f: existingFace(s).f }, { f: proposedFace(s, 2).f }]));
