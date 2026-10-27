import type { PlanResult, PolicyId } from "../planner";
import { kg, money } from "./format";
const labels: Record<PolicyId, string> = { earliestHome: "Earliest at home", waitHome: "Wait at home", regionAndTime: "Choose region + time" };
export default function ComparisonTable({ result }: { result: PlanResult }) {
  const comparison = result.comparison;
  return <section className="comparison-section" aria-labelledby="comparison-heading">
    <div className="section-top"><div><p className="eyebrow">04 / Compare the same work</p><h2 id="comparison-heading">Does moving actually help?</h2></div><span className="muted">Full batch · independent reservations</span></div>
    <div className="table-scroll"><table><caption className="sr-only">Policy outcomes for the accepted scenario</caption><thead><tr><th>Strategy</th><th>Attributed CO₂</th><th>Simulated electricity cost</th><th>Planned / submitted</th><th>Unplaced</th></tr></thead><tbody>{(Object.keys(labels) as PolicyId[]).map(id => {
      const p = result.policies[id];
      return <tr key={id} data-testid={`policy-${id}`} className={id === "regionAndTime" ? "chosen-policy" : ""}><th scope="row">{labels[id]}{id === "waitHome" && <small>Geographic comparison reference</small>}</th><td>{kg(p.totals.carbonKg)}</td><td>{money(p.totals.costUsd)}</td><td>{p.counts.planned} / {p.counts.submitted}</td><td>{p.counts.unplaced}</td></tr>;
    })}</tbody></table></div>
    <div className="comparison-note" aria-live="polite">{comparison.comparable ? <>
      <strong>Change versus waiting at home</strong><span>{comparison.savings.carbonKg! >= 0 ? "Carbon reduction" : "Carbon increase"}: {kg(Math.abs(comparison.savings.carbonKg!))}{comparison.savings.carbonPercent !== null && ` (${Math.abs(comparison.savings.carbonPercent).toFixed(1)}%)`}</span><span>Simulated cost {comparison.savings.costUsd! >= 0 ? "reduction" : "increase"}: {money(Math.abs(comparison.savings.costUsd!))}{comparison.savings.costPercent !== null && ` (${Math.abs(comparison.savings.costPercent).toFixed(1)}%)`}</span>
    </> : <strong>{comparison.reason === "NO_COMPLETED_WORK" ? "No completed work to compare" : "Different work completed; totals are not directly comparable."}</strong>}</div>
  </section>;
}
