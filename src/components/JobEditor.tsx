import type { Job, PlanRequest } from "../planner";
import { hour } from "./format";
export default function JobEditor({ request, job, onEdit, onSelect, onObjective, capacity, onCapacity, presetId, onPreset, presets, onAdd }: {
  request: PlanRequest; job: Job | undefined; onEdit: (job: Job) => void; onSelect: (id: string) => void;
  onObjective: (objective: PlanRequest["objective"]) => void; capacity: string; onCapacity: (value: string) => void;
  presetId: string; onPreset: (id: string) => void; presets: Job[]; onAdd: () => void;
}) {
  return <>
    <div className="section-top"><div><p className="eyebrow">02 / Shape the workload</p><h2>Where should it run?</h2></div><span className="count">{request.jobs.length}/30 jobs</span></div>
    <div className="form-grid">
      <label>Selected job<select value={job?.id ?? ""} onChange={e => onSelect(e.target.value)}>{!job && <option value="">No jobs</option>}{request.jobs.map(j => <option key={j.id}>{j.id}</option>)}</select></label>
      <label>Scheduling priority<select value={request.objective} onChange={e => onObjective(e.target.value as PlanRequest["objective"])}><option value="carbon">Lower carbon first</option><option value="cost">Lower electricity cost first</option></select></label>
    </div>
    {job && <>
      <p className="job-spec mono">{job.durationSlots}h run · {job.gpus} GPUs · {job.facilityPowerKw} kW facility power<br />Home {job.homeRegionId} · released {hour(job.releaseSlot, request.startUtc)} UTC</p>
      <div className="form-grid">
        <label>Finish by (UTC)<select value={job.deadlineSlot} onChange={e => onEdit({ ...job, deadlineSlot: Number(e.target.value) })}>{Array.from({ length: 24 }, (_, i) => i + 1).map(h => <option key={h} value={h}>{hour(h, request.startUtc)}</option>)}</select></label>
        <label>Capacity preset<select value={capacity} onChange={e => onCapacity(e.target.value)}><option value="original">Snapshot capacity</option><option value="zero">No spare GPUs</option></select></label>
      </div>
      <fieldset><legend>Eligible regions</legend><div className="eligibility">{request.regions.map(r => <label key={r.id}><input aria-label={`Allow ${r.id}`} type="checkbox" checked={job.eligibleRegionIds.includes(r.id)} onChange={e => onEdit({ ...job, eligibleRegionIds: e.target.checked ? [...job.eligibleRegionIds, r.id] : job.eligibleRegionIds.filter(id => id !== r.id) })} />{r.id}</label>)}</div></fieldset>
    </>}
    <details className="add-job"><summary>Add a workload preset</summary><label>Workload preset<select value={presetId} onChange={e => onPreset(e.target.value)}>{presets.map(p => <option key={p.id} value={p.id}>{p.id} · {p.durationSlots}h / {p.gpus} GPUs</option>)}</select></label><p className="muted">Release at the inspected hour; deadline six hours later, or the full duration if longer. Values beyond the day are rejected.</p><button className="secondary" onClick={onAdd} disabled={!presets.length || request.jobs.length >= 30}>Add preset at inspected hour</button></details>
  </>;
}
