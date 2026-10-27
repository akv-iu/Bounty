// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as planner from "../src/planner";
import PlannerDashboard from "../src/components/PlannerDashboard";
import { fixture } from "./fixtures";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function setup() {
  const input = fixture();
  input.regions[1].carbonGPerKwh.fill(100);
  input.regions[1].priceUsdPerMwh.fill(200);
  render(<PlannerDashboard initialRequest={input} />);
  return input;
}
const cell = (region: string, hour: string) => screen.getByRole("button", { name: new RegExp(`^${region}, ${hour} UTC,`) });
const select = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

it("updates recommendation, window and every policy after eligibility and deadline edits", () => {
  setup();
  expect(screen.getByTestId("recommendation").textContent).toContain("ERCO");
  fireEvent.click(screen.getByLabelText("Allow ERCO"));
  expect(screen.getByTestId("recommendation").textContent).toContain("CISO");
  for (const id of ["earliestHome", "waitHome", "regionAndTime"]) {
    expect(screen.getByTestId(`policy-${id}`).textContent).toContain("80.00 kg");
  }
  expect(cell("CISO", "00:00").getAttribute("data-assigned")).toBe("true");
  select("Finish by (UTC)", "1");
  expect(screen.getByTestId("recommendation").textContent).toContain("Window too short");
  expect(screen.getByText("No completed work to compare")).toBeTruthy();
  select("Finish by (UTC)", "2");
  expect(screen.getByTestId("recommendation").textContent).toContain("CISO");
});
it("heatmap_measure_does_not_reschedule and does not change assignments", () => {
  const spy = vi.spyOn(planner, "planScenario"); setup(); const calls = spy.mock.calls.length;
  const recommendation = screen.getByTestId("recommendation").textContent;
  fireEvent.click(screen.getByRole("button", { name: "Simulated price" }));
  expect(spy).toHaveBeenCalledTimes(calls);
  expect(screen.getByTestId("recommendation").textContent).toBe(recommendation);
  expect(cell("ERCO", "00:00").getAttribute("data-assigned")).toBe("true");
});
it("inspection_does_not_reschedule and cell_selects_region_and_hour", () => {
  const spy = vi.spyOn(planner, "planScenario"); setup(); const calls = spy.mock.calls.length;
  fireEvent.click(cell("MISO", "03:00"));
  expect((screen.getByLabelText("Inspect region") as HTMLSelectElement).value).toBe("MISO");
  expect((screen.getByLabelText("Inspect hour (UTC)") as HTMLSelectElement).value).toBe("3");
  expect(screen.getByRole("button", {name:"Select MISO on map"}).getAttribute("aria-pressed")).toBe("true");
  select("Inspect hour (UTC)", "5");
  expect(spy).toHaveBeenCalledTimes(calls);
});
it("concurrent_jobs_remain_visible and capacity counts all overlapping jobs", () => {
  const input = fixture(); input.jobs[0].eligibleRegionIds = ["CISO"]; input.jobs[0].deadlineSlot = 2;
  input.jobs.push({ ...input.jobs[0], id: "eval-2" });
  render(<PlannerDashboard initialRequest={input} />);
  fireEvent.click(cell("CISO", "00:00"));
  const detail = within(screen.getByTestId("cell-detail"));
  expect(detail.getByText("0 / 32 GPUs free")).toBeTruthy();
  expect(detail.getByRole("button", {name:"Inspect job eval-1"})).toBeTruthy();
  fireEvent.click(detail.getByRole("button", {name:"Inspect job eval-2"}));
  expect(screen.getByTestId("recommendation").textContent).toContain("eval-2");
});
it("shows one common flat scale and marks missing data separately", () => {
  const input = fixture(); input.regions[0].carbonGPerKwh[5] = null;
  render(<PlannerDashboard initialRequest={input} />);
  expect(screen.getByTestId("heatmap-legend").textContent).toContain("400.0 g CO₂/kWh · constant");
  expect(cell("CISO", "05:00").getAttribute("aria-label")).toContain("Unavailable");
  expect(cell("CISO", "00:00").style.backgroundColor).toBe(cell("ERCO", "00:00").style.backgroundColor);
});
it("capacity rejection can recover without losing the batch", () => {
  setup(); select("Capacity preset", "zero");
  expect(screen.getByTestId("recommendation").textContent).toContain("No feasible window");
  expect(screen.getByText("No completed work to compare")).toBeTruthy();
  expect(screen.getByRole("status").textContent).not.toContain("Placements unchanged");
  select("Capacity preset", "original");
  expect(screen.getByTestId("recommendation").textContent).toContain("ERCO");
});
it("keeps invalid deadline drafts visibly separate and can discard them", () => {
  const input = fixture(); input.jobs[0].releaseSlot = 6;
  const spy = vi.spyOn(planner, "planScenario");
  render(<PlannerDashboard initialRequest={input} />);
  const previous = screen.getByTestId("recommendation").textContent;
  const calls = spy.mock.calls.length;
  select("Finish by (UTC)", "4");
  expect(screen.getByRole("alert").textContent).toContain("Unapplied draft");
  expect(screen.getByTestId("recommendation").textContent).toBe(previous);
  expect(spy).toHaveBeenCalledTimes(calls);
  fireEvent.click(screen.getByRole("button", {name:"Discard unapplied changes"}));
  expect(screen.queryByRole("alert")).toBeNull();
  expect((screen.getByLabelText("Finish by (UTC)") as HTMLSelectElement).value).toBe("24");
});
it("suppresses aggregate savings when eligible destinations exclude home", () => {
  setup(); fireEvent.click(screen.getByLabelText("Allow CISO"));
  expect(screen.getByText("Different work completed; totals are not directly comparable.")).toBeTruthy();
  expect(screen.queryByText("Change versus waiting at home")).toBeNull();
});
it("keyboard selection can inspect a heatmap cell without running the planner", async () => {
  const user = userEvent.setup(); const spy = vi.spyOn(planner, "planScenario"); setup();
  const calls = spy.mock.calls.length;
  cell("ERCO", "04:00").focus();
  await user.keyboard("{Enter}");
  expect((screen.getByLabelText("Inspect region") as HTMLSelectElement).value).toBe("ERCO");
  expect((screen.getByLabelText("Inspect hour (UTC)") as HTMLSelectElement).value).toBe("4");
  expect(spy).toHaveBeenCalledTimes(calls);
});
it("uses the request's UTC start and day rollover in every time view", () => {
  const input = fixture(); input.startUtc = "2026-07-01T22:30:00Z";
  render(<PlannerDashboard initialRequest={input} />);
  expect(screen.getByTestId("recommendation").textContent).toContain("22:30—00:30 (+1d) UTC");
  expect(cell("CISO", "22:30")).toBeTruthy();
  select("Inspect hour (UTC)", "2");
  expect(screen.getByTestId("cell-detail").textContent).toContain("00:30 (+1d)—01:30 (+1d) UTC");
  expect((screen.getByLabelText("Finish by (UTC)") as HTMLSelectElement).selectedOptions[0].text).toBe("22:30 (+1d)");
});
it("preserves release during edits and rejects a new job beyond the horizon", () => {
  const spy = vi.spyOn(planner, "planScenario"); setup();
  select("Inspect hour (UTC)", "23"); select("Finish by (UTC)", "12");
  expect(spy.mock.calls.at(-1)![0].jobs[0].releaseSlot).toBe(0);
  const calls = spy.mock.calls.length;
  fireEvent.click(screen.getByRole("button", {name:"Add preset at inspected hour"}));
  expect(screen.getByRole("alert").textContent).toContain("Unapplied draft");
  expect(spy).toHaveBeenCalledTimes(calls);
  expect(screen.getByTestId("recommendation").textContent).toContain("eval-1");
});
it("adds a preset at inspected release and switches objective with one shared result", () => {
  const spy = vi.spyOn(planner, "planScenario"); setup();
  select("Inspect hour (UTC)", "6");
  fireEvent.click(screen.getByRole("button", {name:"Add preset at inspected hour"}));
  expect(spy.mock.calls.at(-1)![0].jobs.at(-1)!.releaseSlot).toBe(6);
  select("Scheduling priority", "cost");
  expect(screen.getByTestId("recommendation").textContent).toContain("CISO");
  expect(screen.getByTestId("policy-regionAndTime").textContent).toContain("$40.00");
});
