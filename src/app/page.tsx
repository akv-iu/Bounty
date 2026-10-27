import snapshot from "../../data/scenario.json";
import { validateScenario } from "../planner";

export default function Home() {
  const validation = validateScenario(snapshot);
  if (!validation.ok) throw new Error(`Invalid bundled scenario: ${JSON.stringify(validation.issues)}`);
  const scenario = validation.value;
  const historical = scenario.provenance.mode === "historical";
  return <main>
    <p className="eyebrow">Energy × AI infrastructure · P1 foundation</p>
    <h1>Compute follows the sun.</h1>
    <p>Five regions. One shared day. A foundation for choosing when and where flexible AI jobs run.</p>
    <h2>{historical ? "Historical carbon. Simulated compute." : "Fully synthetic scenario."}</h2>
    <p>{historical ? `Carbon inputs are EIA consumption emissions estimates for ${scenario.startUtc.slice(0, 10)}.` : "Carbon inputs are illustrative daily waves."} Prices, GPU capacity, workloads and facility power are synthetic. This is a historical replay or teaching scenario, not a forecast or cloud reservation.</p>
    <p>Scenario starts {scenario.startUtc}. Each row contains 24 one-hour UTC intervals. The scheduler, interactive map and heatmap arrive in the next approved phases.</p>
    <div className="table-scroll"><table>
      <caption>Validated snapshot · {scenario.jobs.length} example jobs · carbon in g CO₂/kWh</caption>
      <thead><tr><th scope="col">Simulated pool</th><th scope="col">Grid proxy</th><th scope="col">Carbon range</th><th scope="col">Coverage</th></tr></thead>
      <tbody>{scenario.regions.map(region => {
        const values = region.carbonGPerKwh.filter((v): v is number => v !== null);
        return <tr key={region.id}><th scope="row">{region.name}</th><td>{region.id}</td><td>{values.length ? `${Math.min(...values).toFixed(1)}–${Math.max(...values).toFixed(1)}` : "Unavailable"}</td><td>{values.length}/24</td></tr>;
      })}</tbody>
    </table></div>
    <h2>Ready for the data checkpoint</h2>
    <p>No jobs have been scheduled and no savings have been calculated. H1 reviews the data labels and reusable input/output contract before the planning engine is built.</p>
  </main>;
}
