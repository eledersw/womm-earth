"use client";
// Gaia: a tiny pixel Earth that sits on top of the Gaia pane. Blue body, green pixel
// countries, two arms, two legs. It fidgets while Gaia is explaining or
// answering and only blinks otherwise. Motion rules live in app/globals.css.
import { useUiStore } from "@/lib/state/ui-store";

// 14 x 12 pixel grid. Each body row lists the [from, to] columns it covers.
const BODY: [number, number][] = [[5, 8], [3, 10], [2, 11], [2, 11], [2, 11], [2, 11], [2, 11], [2, 11], [3, 10], [5, 8]];
const LAND: [number, number][] = [
  [1, 4], [1, 5], [2, 3], [2, 4], [3, 3], // north-west continent
  [2, 9], [3, 9], [3, 10], [4, 10], // north-east
  [6, 3], [7, 3], [7, 4], [8, 4], // south-west
  [7, 8], [7, 9], [8, 8], // south-east
  [1, 8], // an island
];
const EYES: [number, number][] = [[4, 5], [5, 5], [4, 8], [5, 8]];

const px = (row: number, col: number, key: string) => <rect key={key} x={col} y={row} width={1} height={1} />;

export function GaiaMascot({ scale = 1 }: { scale?: number }) {
  const busy = useUiStore((s) => s.gaiaBusy > 0);
  return (
    <svg viewBox="0 0 14 12" width={42 * scale} height={36 * scale} shapeRendering="crispEdges" aria-hidden
      className="gaia-mascot shrink-0 overflow-visible" data-busy={busy}>
      <g className="gaia-whole">
        <g className="gaia-leg gaia-leg-l" fill="#2d63b3">{px(10, 5, "a")}{px(11, 5, "b")}</g>
        <g className="gaia-leg gaia-leg-r" fill="#2d63b3">{px(10, 8, "a")}{px(11, 8, "b")}</g>
        <g className="gaia-body">
          <g className="gaia-arm gaia-arm-l" fill="#3b7dd8">{px(5, 0, "a")}{px(5, 1, "b")}</g>
          <g className="gaia-arm gaia-arm-r" fill="#3b7dd8">{px(5, 13, "a")}{px(5, 12, "b")}</g>
          <g fill="#3b7dd8">{BODY.map(([from, to], row) => <rect key={row} x={from} y={row} width={to - from + 1} height={1} />)}</g>
          <g fill="#4fbf5a">{LAND.map(([row, col]) => px(row, col, `${row}-${col}`))}</g>
          <g className="gaia-eyes" fill="#08111f">{EYES.map(([row, col]) => px(row, col, `${row}-${col}`))}</g>
        </g>
      </g>
    </svg>
  );
}
