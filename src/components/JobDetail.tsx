import type { Job, PlanRequest, PlanResult, UnplacedReason } from "../planner";
import { hour, kg, money } from "./format";
const reasons: Record<UnplacedReason, string> = { NO_ELIGIBLE_REGION: "No eligible region", WINDOW_TOO_SHORT: "Window too short", NO_FEASIBLE_WINDOW: "No feasible window: capacity or missing signals under this policy’s reservations" };
export default function JobDetail({ request, result, job }: { request: PlanRequest; result: PlanResult; job: Job | undefined }) {
  const chosen = result.policies.regionAndTime.assignments.find(a => a.jobId === job?.id);
  const rejected = result.policies.regionAndTime.unplaced.find(a => a.jobId === job?.id);
  const home = result.policies.waitHome.assignments.find(a => a.jobId === job?.id);
  const alternative = chosen?.alternatives.find(a => a.regionId !== chosen.regionId) ?? chosen?.alternatives.find(a => a.startSlot !== chosen.startSlot);
  return <div className={`recommendation ${chosen ? "" : "no-placement"}`} data-testid="recommendation" aria-live="polite">
    <p className="eyebrow">{job?.id ?? "No selected job"} / Calculated recommendation</p>
    {chosen ? <>
      <h3>{request.regions.find(r => r.id === chosen.regionId)?.name} <span className="mono">{chosen.regionId}</span></h3>
      <p className="chosen-window">{hour(chosen.startSlot, request.startUtc)}—{hour(chosen.endSlot, request.startUtc)} UTC <span>· {job!.durationSlots} hours</span></p>
      <div className="result-pair"><strong>{kg(chosen.carbonKg)} <small>attributed CO₂</small></strong><strong>{money(chosen.costUsd)} <small>simulated electricity cost</small></strong></div>
      <p>{chosen.alternatives.length} feasible windows at this decision. Ranked by {request.objective === "carbon" ? "whole-run carbon, then cost" : "whole-run cost, then carbon"}; ties favor an earlier start, then region ID.</p>
      <details><summary>Why this window?</summary>
        <p>{alternative ? `${alternative.regionId !== chosen.regionId ? "Strongest option in another region" : "Strongest other window"}: ${alternative.regionId}, ${hour(alternative.startSlot, request.startUtc)}–${hour(alternative.endSlot, request.startUtc)} UTC · ${kg(alternative.carbonKg)} · ${money(alternative.costUsd)} simulated cost. This option ranked behind the selected window under the stated ordering.` : "No other feasible window at this decision."}</p>
        <p>{home ? `Wait-at-home result: ${home.regionId}, ${hour(home.startSlot, request.startUtc)}–${hour(home.endSlot, request.startUtc)} UTC · ${kg(home.carbonKg)} · ${money(home.costUsd)} simulated cost.` : "Wait-at-home policy did not place this job."}</p>
        <p className="muted">Alternatives were captured before this job reserved capacity. Home-only results use independent reservations. Neither is a guarantee of global optimality.</p>
      </details>
    </> : <><h3>{rejected ? reasons[rejected.reason] : "Add a job to begin"}</h3><p>No placement found under this policy’s reservations. No cost or carbon outcome is invented for unplaced work.</p></>}
  </div>;
}
