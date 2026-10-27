import snapshot from "../../data/scenario.json";
import { validateScenario } from "../planner";
import PlannerDashboard from "../components/PlannerDashboard";

export default function Home() {
  const validation = validateScenario(snapshot);
  if (!validation.ok) throw new Error(`Invalid bundled scenario: ${JSON.stringify(validation.issues)}`);
  return <PlannerDashboard initialRequest={validation.value} />;
}
