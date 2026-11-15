import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { serverApi } from "@/lib/api/client";
import type { RegionAnalysis, Variable } from "@/lib/api/types";
import { shareCopy } from "@/lib/copy/share";
import { cardFileName, cardModel, sparklines, type CardModel, type CardRow } from "@/lib/share/card";
import { caseFromQuery } from "@/lib/state/case-codec";

// The share card: a 1200×630 picture of a Case's results, for link previews
// (generateMetadata in app/app/page.tsx points og:image here) and the PNG download.
// Same query as the Case link. The engine runs server-side, so a card can't be
// edited to show numbers the Case doesn't produce.
export const maxDuration = 60;

const WIDTH = 1200;
const HEIGHT = 630;
/** Link-preview crawlers give up after a few seconds; the in-app download waits (wait=1). */
const CRAWLER_WAIT_MS = 8_000;
const APP_WAIT_MS = 50_000;

// Satori can't read CSS variables: resolved values of app/tokens.css ("Silver Orbit").
const C = {
  space: "#030405", ink: "#e4e9eb", silver: "#c9d0d2", ink2: "#a5aeb1", ink3: "#8d9496",
  hairline: "rgba(201,208,210,0.14)", hairlineStrong: "rgba(201,208,210,0.3)",
  glass: "rgba(255,255,255,0.03)", glassEdge: "rgba(255,255,255,0.14)",
  actionTop: "#f1f4f5", actionBottom: "#b4bdc0", actionInk: "#050607",
  pens: ["#c98318", "#14a08a", "#c062c4", "#b9c2c6"],
};

const fontFiles = [
  ["Headline", 200, "headline-200-latin.woff"], ["Headline", 200, "headline-200-latin-ext.woff"],
  ["Text", 400, "text-400-latin.woff"], ["Text", 400, "text-400-latin-ext.woff"],
  ["Text", 500, "text-500-latin.woff"], ["Text", 500, "text-500-latin-ext.woff"],
  ["Mono", 400, "mono-400-latin.woff"], ["Mono", 400, "mono-400-latin-ext.woff"],
] as const;

let assets: Promise<{ fonts: { name: string; data: Buffer; weight: 200 | 400 | 500; style: "normal" }[]; logo: string }> | null = null;
function loadAssets() {
  assets ??= (async () => {
    const fonts = await Promise.all(fontFiles.map(async ([name, weight, file]) => ({
      name, weight, style: "normal" as const, data: await readFile(join(process.cwd(), "assets/fonts", file)),
    })));
    const svg = await readFile(join(process.cwd(), "public/womm-earth-logo-dark-mode.svg"));
    return { fonts, logo: `data:image/svg+xml;base64,${svg.toString("base64")}` };
  })().catch((error) => { assets = null; throw error; });
  return assets;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = caseFromQuery(url.searchParams);
  const wait = url.searchParams.get("wait") === "1" ? APP_WAIT_MS : CRAWLER_WAIT_MS;
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const py = serverApi(url.origin, bypass ? { "x-vercel-protection-bypass": bypass } : {});
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(wait)]);

  const variablesRequest = py.GET("/api/py/variables", { signal }).then(({ data }) => data ?? null).catch(() => null);
  const analysisRequest = state.regions.length
    ? py.POST("/api/py/analyze", {
      body: { variable: state.variable, regions: state.regions, start: state.from, end: state.to, season: state.season, months: state.months },
      signal,
    }).then(({ data }) => (data?.results as RegionAnalysis[] | undefined) ?? null).catch(() => null)
    : Promise.resolve(null);
  const [variables, results] = await Promise.all([variablesRequest, analysisRequest]);
  const variable = (variables as Variable[] | null)?.find((v) => v.id === state.variable);

  // Without results (NASA slow, bad link) the card still names the Case's places.
  let names: Record<string, string> = {};
  if (!results && state.regions.length) {
    const { data } = await py.GET("/api/py/regions", { signal: AbortSignal.timeout(3_000) }).catch(() => ({ data: undefined }));
    names = Object.fromEntries((data ?? []).map((r) => [r.id, r.name]));
  }

  const model = cardModel(state, variable, results, names);
  const { fonts, logo } = await loadAssets();
  const headers: Record<string, string> = {
    // Results for a Case only change when NASA publishes a new month: cache a day.
    "Cache-Control": model.ready
      ? "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
      : "public, max-age=0, s-maxage=60",
  };
  if (url.searchParams.get("download") === "1") headers["Content-Disposition"] = `attachment; filename="${cardFileName(state)}"`;
  return new ImageResponse(<Card model={model} logo={logo} />, { width: WIDTH, height: HEIGHT, fonts, headers });
}

function Card({ model, logo }: { model: CardModel; logo: string }) {
  const rows = model.rows;
  const dense = rows.length > 2;
  return (
    <div style={{
      width: WIDTH, height: HEIGHT, display: "flex", flexDirection: "column", padding: "52px 64px 44px",
      backgroundColor: C.space, color: C.ink, fontFamily: "Text",
      backgroundImage: "radial-gradient(ellipse 900px 520px at 92% -10%, rgba(150,166,176,0.20), transparent), radial-gradient(ellipse 700px 420px at -5% 110%, rgba(92,104,112,0.16), transparent)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori draws plain <img> */}
        <img src={logo} width={229} height={30} alt="" />
        <Mono size={15} color={C.ink3}>{shareCopy.card.eyebrow}</Mono>
      </div>

      <div style={{ display: "flex", flexDirection: "column", marginTop: dense ? 26 : 38 }}>
        <div style={{ display: "flex", fontFamily: "Headline", fontWeight: 200, fontSize: dense ? 56 : 68, lineHeight: 1, letterSpacing: -1.2, color: C.silver }}>
          {model.title}
        </div>
        <div style={{ display: "flex", marginTop: 14 }}><Mono size={18} color={C.ink2}>{model.subtitle}</Mono></div>
      </div>

      <div style={{
        display: "flex", flexDirection: "column", flex: 1, marginTop: dense ? 24 : 34, borderRadius: 16,
        border: `1px solid ${C.glassEdge}`, backgroundColor: C.glass, padding: "4px 28px",
      }}>
        {rows.length ? rows.map((row, i) => <Row key={i} row={row} dense={dense} last={i === rows.length - 1} />) : (
          <div style={{ display: "flex", flex: 1, alignItems: "center", fontSize: 26, color: C.ink2 }}>{shareCopy.card.noRegions}</div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 22 }}>
        <Mono size={15} color={C.ink2}>{shareCopy.card.site}</Mono>
        <Mono size={15} color={C.ink3}>{shareCopy.card.footer}</Mono>
      </div>
    </div>
  );
}

function Row({ row, dense, last }: { row: CardRow; dense: boolean; last: boolean }) {
  const pen = C.pens[row.pen] ?? C.silver;
  const lineW = dense ? 200 : 260;
  const lineH = dense ? 48 : 84;
  const lines = sparklines(row.values, lineW, lineH);
  return (
    <div style={{
      display: "flex", flex: 1, alignItems: "center", gap: 28,
      borderBottom: last ? "none" : `1px solid ${C.hairline}`,
    }}>
      <div style={{ display: "flex", flexDirection: "column", width: dense ? 330 : 360 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, backgroundColor: pen }} />
          <div style={{ display: "flex", fontSize: dense ? 26 : 32, fontWeight: 500, color: C.ink, lineHeight: 1.15 }}>{row.name}</div>
        </div>
        {row.evidence ? <div style={{ display: "flex", marginTop: 8, marginLeft: 28 }}><Mono size={13} color={C.ink3}>{row.evidence}</Mono></div> : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: dense ? 6 : 10 }}>
        <Tier row={row} />
        {row.change ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <div style={{ display: "flex", fontFamily: "Headline", fontWeight: 200, fontSize: dense ? 32 : 44, lineHeight: 1, color: C.silver }}>{row.change}</div>
            <Mono size={13} color={C.ink3}>{shareCopy.card.perDecade}</Mono>
          </div>
        ) : null}
      </div>

      {lines.length ? (
        <svg width={lineW} height={lineH} viewBox={`0 0 ${lineW} ${lineH}`}>
          {lines.map((points, i) => <polyline key={i} points={points} fill="none" stroke={pen} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />)}
        </svg>
      ) : null}
    </div>
  );
}

function Tier({ row }: { row: CardRow }) {
  if (row.tier === null) return <div style={{ display: "flex", fontSize: 20, color: C.ink2 }}>{row.tierLabel}</div>;
  const confirmed = row.tier === "confirmed";
  const open = row.tier === "not_proven";
  return (
    <div style={{ display: "flex" }}>
      <div style={{
        display: "flex", alignItems: "center", height: 30, padding: "0 14px", borderRadius: 15,
        ...(confirmed ? { backgroundImage: `linear-gradient(180deg, ${C.actionTop}, ${C.actionBottom})` } : {}),
        border: confirmed ? "none" : `1px solid ${open ? C.hairlineStrong : C.hairline}`,
      }}>
        <Mono size={13} color={confirmed ? C.actionInk : open ? C.silver : C.ink3}>{row.tierLabel}</Mono>
      </div>
    </div>
  );
}

function Mono({ size, color, children }: { size: number; color: string; children: string }) {
  return <div style={{ display: "flex", fontFamily: "Mono", fontSize: size, color, letterSpacing: size * 0.16, textTransform: "uppercase" }}>{children}</div>;
}
