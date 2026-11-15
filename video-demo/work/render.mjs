// Renders video-demo/work/comp/index.html frame by frame (30 fps).
// STILLS=1 renders only the check stills listed below.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
const comp = "file:///" + path.resolve("video-demo/work/comp/index.html").replace(/\\/g, "/");
const out = "video-demo/work/frames";
const stillsDir = "video-demo/work/stills";
const FPS = 30, FRAMES = 900;
const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(comp);
await page.evaluate(() => window.ready);
const stage = page.locator("#stage");
if (process.env.STILLS) {
  fs.mkdirSync(stillsDir, { recursive: true });
  for (const t of process.env.STILLS.split(",").map(Number)) {
    await page.evaluate((tt) => window.render(tt), t);
    await stage.screenshot({ path: `${stillsDir}/t${t.toFixed(2)}.jpg`, type: "jpeg", quality: 85 });
  }
} else {
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  for (let f = 0; f < FRAMES; f++) {
    await page.evaluate((tt) => window.render(tt), f / FPS);
    await stage.screenshot({ path: `${out}/${String(f).padStart(4, "0")}.jpg`, type: "jpeg", quality: 93 });
    if (f % 150 === 0) console.log("frame", f);
  }
}
await browser.close();
