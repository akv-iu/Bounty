import type { Assignment, Region } from "../planner";
import { hour } from "./format";
export type HeatmapMeasure = "carbon" | "price";
export default function RegionHeatmap({ regions, startUtc, measure, onMeasure, selectedRegionId, slot, assignment, onInspect }: {
  regions: Region[]; startUtc: string; measure: HeatmapMeasure; onMeasure: (measure: HeatmapMeasure) => void;
  selectedRegionId: string; slot: number; assignment: Assignment | undefined; onInspect: (region: string, hour: number) => void;
}) {
  const key = measure === "carbon" ? "carbonGPerKwh" : "priceUsdPerMwh";
  const values = regions.flatMap(r => r[key]).filter((v): v is number => v !== null);
  const min = Math.min(...values), max = Math.max(...values), constant = min === max;
  const unit = measure === "carbon" ? "g CO₂/kWh" : "USD/MWh (simulated)";
  // Fall back to halving only when subtracting opposite-sign extremes overflows.
  const color = (value: number) => {
    const range = max - min;
    const t = constant ? 0.5 : Number.isFinite(range) ? (value - min) / range : (value / 2 - min / 2) / (max / 2 - min / 2);
    return `hsl(${145 - t * 105} 36% ${27 + t * 27}%)`;
  };
  return <section className="heatmap-section" aria-labelledby="heatmap-heading">
    <div className="section-top"><div><p className="eyebrow">03 / Find the window</p><h2 id="heatmap-heading">A day of possibilities.</h2></div><div className="segmented" aria-label="Heatmap measure"><button aria-pressed={measure === "carbon"} onClick={() => onMeasure("carbon")}>Carbon intensity</button><button aria-pressed={measure === "price"} onClick={() => onMeasure("price")}>Simulated price</button></div></div>
    <p className="muted heatmap-hint">Color shows the input signal, not free capacity. White outlines mark the selected job’s full window; the dot marks your inspected cell.</p>
    <div className="heatmap-scroll" role="region" aria-label="Hourly heatmap; scroll horizontally on small screens" tabIndex={0}>
      <div className="heatmap-grid">
        <div className="heatmap-row axis-row"><span className="row-label">UTC hour</span>{Array.from({length:24}, (_, h) => <span key={h}>{hour(h, startUtc)}</span>)}</div>
        {regions.map(region => <div className="heatmap-row" key={region.id}><span className="row-label">{region.id}<small>{region.name.replace(" pool", "")}</small></span>{region[key].map((value, h) => {
          const assigned = assignment?.regionId === region.id && h >= assignment.startSlot && h < assignment.endSlot;
          const selected = region.id === selectedRegionId && h === slot;
          return <button key={h} className={`heat-cell ${assigned ? "assigned" : ""} ${value === null ? "missing" : ""}`} style={value === null ? undefined : { backgroundColor: color(value) }} data-assigned={!!assigned} aria-pressed={selected} aria-label={`${region.id}, ${hour(h, startUtc)} UTC, ${value === null ? "Unavailable" : `${value.toFixed(1)} ${unit}`}${assigned ? `, selected job ${assignment.jobId}` : ""}`} title={`${region.name} · ${hour(h, startUtc)} · ${value === null ? "Unavailable" : `${value.toFixed(1)} ${unit}`}`} onClick={() => onInspect(region.id, h)}>{selected ? "●" : value === null ? "×" : ""}</button>;
        })}</div>)}
      </div>
    </div>
    <div className="heatmap-footer"><span data-testid="heatmap-legend">{!values.length ? "All signals unavailable" : constant ? `${min.toFixed(1)} ${unit} · constant` : <><span className="legend-ramp" />{min.toFixed(1)} — {max.toFixed(1)} {unit} · low → high</>}</span><span>× unavailable · same scale across all pools</span></div>
  </section>;
}
