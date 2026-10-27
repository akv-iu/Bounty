"use client";
import { useState } from "react";
import { planScenario, validateScenario, type Job, type PlanRequest } from "../planner";
import RegionMap from "./RegionMap";
import RegionHeatmap, { type HeatmapMeasure } from "./RegionHeatmap";
import JobEditor from "./JobEditor";
import JobDetail from "./JobDetail";
import ComparisonTable from "./ComparisonTable";
import { hour } from "./format";

export default function PlannerDashboard({ initialRequest }: { initialRequest: PlanRequest }) {
  const [accepted, setAccepted] = useState(() => ({ request: initialRequest, result: planScenario(initialRequest) }));
  const [draft, setDraft] = useState(initialRequest);
  const [error, setError] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(initialRequest.jobs[0]?.id ?? "");
  const [selectedRegionId, setSelectedRegionId] = useState(initialRequest.jobs[0]?.homeRegionId ?? initialRequest.regions[0].id);
  const [slot, setSlot] = useState(0);
  const [measure, setMeasure] = useState<HeatmapMeasure>("carbon");
  const [capacity, setCapacity] = useState("original");
  const [presetId, setPresetId] = useState(initialRequest.jobs[0]?.id ?? "");
  const [updateNote, setUpdateNote] = useState("Initial batch planned. Edit a deadline or eligible region to explore a different outcome.");
  const { request, result } = accepted;
  const selectedJob = request.jobs.find(j => j.id === selectedJobId);
  const selectedRegion = request.regions.find(r => r.id === selectedRegionId)!;
  const assignment = result.policies.regionAndTime.assignments.find(a => a.jobId === selectedJobId);
  const overlapping = result.policies.regionAndTime.assignments.filter(a => a.regionId === selectedRegionId && slot >= a.startSlot && slot < a.endSlot);
  const usedGpus = overlapping.reduce((sum, a) => sum + request.jobs.find(j => j.id === a.jobId)!.gpus, 0);
  const freeGpus = selectedRegion.availableGpus[slot] - usedGpus;

  function commit(next: PlanRequest): boolean {
    const validation = validateScenario(next);
    if (!validation.ok) { setError(validation.issues.map(i => `${i.path}: ${i.reason}`).join("; ")); return false; }
    try {
      const nextResult = planScenario(validation.value);
      const changed = next.jobs.filter(job => {
        const current = nextResult.policies.regionAndTime.assignments.find(a => a.jobId === job.id);
        const old = result.policies.regionAndTime.assignments.find(a => a.jobId === job.id);
        return current?.regionId !== old?.regionId || current?.startSlot !== old?.startSlot || current?.endSlot !== old?.endSlot;
      }).map(job => job.id);
      const unplaced = nextResult.policies.regionAndTime.unplaced.map(a => a.jobId);
      setUpdateNote(`${changed.length ? `Changed placements: ${changed.join(", ")}.` : "Placements unchanged: any placed windows still rank first among feasible candidates."}${unplaced.length ? ` Unplaced: ${unplaced.join(", ")}.` : " All jobs placed."}`);
      setAccepted({ request: validation.value, result: nextResult }); setError(""); return true;
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Calculation failed"); return false; }
  }
  function edit(next: PlanRequest) { setDraft(next); commit(next); }
  function addPreset() {
    const preset = initialRequest.jobs.find(j => j.id === presetId);
    if (!preset) return;
    let n = 1; while (draft.jobs.some(j => j.id === `${preset.id}-${n}`)) n++;
    const job: Job = { ...preset, id: `${preset.id}-${n}`, releaseSlot: slot, deadlineSlot: slot + Math.max(6, preset.durationSlots), eligibleRegionIds: [...preset.eligibleRegionIds] };
    const next = { ...draft, jobs: [...draft.jobs, job] };
    if (commit(next)) { setDraft(next); setSelectedJobId(job.id); }
  }
  return <main>
    <header className="site-header"><a className="wordmark" href="#top"><span className="sun-mark" aria-hidden="true">✳</span> sunward<span className="wordmark-tag">COMPUTE PLANNER</span></a><span className="prototype-label">Planning simulator <span aria-hidden="true">↗</span></span></header>
    <section className="intro" id="top"><p className="eyebrow">Energy × AI infrastructure</p><h1>Good work.<br /><span>Better timing.</span></h1><p className="intro-copy">Find a place and a time for flexible AI workloads.<br />See what changes. Understand the tradeoff.</p>
      <div className="scenario-line"><span className="status-dot" /><strong>{request.provenance.mode === "historical" ? "Historical carbon replay" : "Fully synthetic scenario"}</strong><span>· simulated prices and workloads</span><span className="scenario-date mono">{request.startUtc.slice(0,10)} · 24 hours UTC</span></div>
      <p className="scenario-disclaimer">Historical replay uses hindsight, not a forecast. Results are calculated plans; no real compute is dispatched.</p>
    </section>
    {error && <div className="draft-error" role="alert"><strong>Unapplied draft — showing the last valid plan.</strong><p>{error}</p><button onClick={() => { setDraft(request); setCapacity(request.regions.every(r => r.availableGpus.every(v => v === 0)) ? "zero" : "original"); setError(""); }}>Discard unapplied changes</button></div>}
    <div className="workspace">
      <RegionMap regions={request.regions} selected={selectedRegion} slot={slot} startUtc={request.startUtc} freeGpus={freeGpus} onRegion={setSelectedRegionId} onHour={setSlot} />
      <section className="panel workload-panel" aria-label="Workload planning"><JobEditor request={draft} job={draft.jobs.find(j => j.id === selectedJobId)} onEdit={job => edit({ ...draft, jobs: draft.jobs.map(j => j.id === job.id ? job : j) })} onSelect={setSelectedJobId} onObjective={objective => edit({ ...draft, objective })} capacity={capacity} onCapacity={value => {
        setCapacity(value); edit({ ...draft, regions: draft.regions.map(r => ({ ...r, availableGpus: value === "zero" ? Array(24).fill(0) : [...initialRequest.regions.find(original => original.id === r.id)!.availableGpus] })) });
      }} presetId={presetId} onPreset={setPresetId} presets={initialRequest.jobs} onAdd={addPreset} /><JobDetail request={request} result={result} job={selectedJob} /></section>
    </div>
    <p className="update-note" role="status">{updateNote}</p>
    <RegionHeatmap startUtc={request.startUtc} regions={request.regions} measure={measure} onMeasure={setMeasure} selectedRegionId={selectedRegionId} slot={slot} assignment={assignment} onInspect={(id, h) => { setSelectedRegionId(id); setSlot(h); }} />
    <div className="cell-detail" data-testid="cell-detail"><div><span className="eyebrow">Inspected cell</span><h3>{selectedRegion.name} · {hour(slot, request.startUtc)}—{hour(slot + 1, request.startUtc)} UTC</h3><span className="mono">{freeGpus} / {selectedRegion.availableGpus[slot]} GPUs free</span></div><div className="overlapping-jobs"><span className="muted">{overlapping.length ? `${overlapping.length} overlapping ${overlapping.length === 1 ? "job" : "jobs"}` : "No jobs in this cell"}</span>{overlapping.map(a => <button key={a.jobId} aria-label={`Inspect job ${a.jobId}`} aria-pressed={a.jobId === selectedJobId} onClick={() => setSelectedJobId(a.jobId)}>{a.jobId} · {request.jobs.find(j => j.id === a.jobId)!.gpus} GPUs</button>)}</div></div>
    <ComparisonTable result={result} />
    <details className="assumptions"><summary>Data, assumptions & limits <span>Read before interpreting the numbers</span></summary><div className="assumption-grid"><div><h3>Where the inputs come from</h3><p>{request.provenance.mode === "historical" ? "Carbon is EIA’s provider-estimated consumption intensity for the selected historical day." : "Carbon is authored synthetic data for this scenario."} Prices, capacity and workloads are synthetic. Electricity cost is not a cloud GPU bill. Price generator seed: {request.provenance.priceSeed}.</p><ul>{request.regions.map(r => <li key={r.id}>{r.id}: {r.carbonSource.url ? <a href={r.carbonSource.url} target="_blank" rel="noreferrer">{r.carbonSource.label}</a> : r.carbonSource.label}</li>)}</ul></div><div><h3>What the model assumes</h3><p>Equivalent hardware and runtime, with inputs already available in each eligible pool. Jobs run in one uninterrupted window. Facility kW already includes overhead. No data-transfer, queueing or execution latency is modeled.</p><p>Deterministic greedy scheduling can leave schedulable work unplaced. Attributed CO₂ is not measured marginal emissions avoided. Aggregate differences require the same nonempty completed job set in all three policies.</p></div></div></details>
    <footer><span>sunward / An independent Torus hackathon project</span><span>Approximate pool locations · <a href="/notices.txt">Map & font credits</a></span></footer>
  </main>;
}
