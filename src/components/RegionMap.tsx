import type { Region } from "../planner";
import { hour, localTime } from "./format";

// Positions share the accepted prototype's 600 × 340 projection; these are representative pools, not cloud sites.
const pins: Record<string, { x: number; y: number; label: string }> = {
  CISO: { x: 14.1185, y: 45.8887, label: "CA" }, PACE: { x: 26.9138, y: 42.8612, label: "UT" },
  ERCO: { x: 45.2464, y: 74.1843, label: "TX" }, MISO: { x: 61.2553, y: 43.0740, label: "MW" }, PJM: { x: 77.8401, y: 48.4321, label: "VA" },
};
export default function RegionMap({ regions, selected, slot, startUtc, freeGpus, onRegion, onHour }: {
  regions: Region[]; selected: Region; slot: number; startUtc: string; freeGpus: number;
  onRegion: (id: string) => void; onHour: (slot: number) => void;
}) {
  return <section className="panel map-panel" aria-labelledby="map-heading">
    <div className="section-top"><div><p className="eyebrow">01 / Explore the grid</p><h2 id="map-heading">Five pools. One shared day.</h2></div><span className="time-chip">{hour(slot, startUtc)} UTC</span></div>
    <div className="region-map">
      {/* Local SVG keeps map exploration independent of third-party requests. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/us-map.svg" alt="Contiguous United States; pins indicate approximate simulated pool locations" width="600" height="340" />
      {regions.map(region => pins[region.id] && <button key={region.id} className="map-pin" style={{ left: `${pins[region.id].x}%`, top: `${pins[region.id].y}%` }} aria-label={`Select ${region.id} on map`} aria-pressed={region.id === selected.id} onClick={() => onRegion(region.id)}>{pins[region.id].label}</button>)}
    </div>
    <div className="region-heading"><h3>{selected.name}</h3><span className="muted mono">{selected.id} · {localTime(startUtc, slot, selected.timeZone)}</span></div>
    <dl className="metrics">
      <div><dt>{selected.carbonSource.kind === "historical-estimate" ? "Estimated" : "Synthetic"} carbon</dt><dd>{selected.carbonGPerKwh[slot]?.toFixed(1) ?? "Unavailable"}<small>g CO₂/kWh</small></dd></div>
      <div><dt>Simulated price</dt><dd>{selected.priceUsdPerMwh[slot]?.toFixed(1) ?? "Unavailable"}<small>USD/MWh</small></dd></div>
      <div><dt>Simulated capacity</dt><dd>{freeGpus}<small>of {selected.availableGpus[slot]} GPUs free</small></dd></div>
    </dl>
    <div className="inspection-controls">
      <label>Inspect region<select value={selected.id} onChange={e => onRegion(e.target.value)}>{regions.map(r => <option value={r.id} key={r.id}>{r.name}</option>)}</select></label>
      <label>Inspect hour (UTC)<select value={slot} onChange={e => onHour(Number(e.target.value))}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{hour(h, startUtc)}</option>)}</select></label>
    </div>
    <label className="scrubber">Inspect timeline <span className="muted">Selection only · does not reschedule</span><input aria-label="Inspect timeline" type="range" min="0" max="23" step="1" value={slot} onChange={e => onHour(Number(e.target.value))} /></label>
    <div className="axis">{[0, 6, 12, 18, 23].map(h => <span key={h}>{hour(h, startUtc)}</span>)}</div>
  </section>;
}
