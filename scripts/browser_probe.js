// Local-only instrumentation, served by serve_probe.py; absent from out/.
import { planScenario } from '/__planner/index.js';
const snapshot = await (await fetch('/__scenario.json')).json();
const request = structuredClone(snapshot);
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const select = label => [...document.querySelectorAll('label')].find(e => e.firstChild?.textContent === label)?.querySelector('select');
const afterRender = () => new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
const change = (element, value) => { element.value = value; element.dispatchEvent(new Event('change', { bubbles: true })); };
const samples = [], failures = [];
let armed = false, busy = false;
let eligibilityStart = null;
const panel = document.createElement('aside');
panel.style.cssText = 'position:fixed;z-index:9999;top:4px;left:4px;padding:8px;background:white;color:black;font:14px monospace;border:2px solid black';
panel.innerHTML = '<button id="probe-prepare">Prepare 30 jobs</button> <button id="probe-save">Save report</button><p id="probe-status">Local measurement only — not shipped</p>';
document.body.append(panel);
const status = text => { document.querySelector('#probe-status').textContent = text; };
const percentiles = values => {
  assert(values.length > 0 && values.every(Number.isFinite), 'Invalid samples');
  const sorted = [...values].sort((a,b) => a-b);
  return { p50Ms: sorted[Math.ceil(sorted.length * .5)-1], p95Ms: sorted[Math.ceil(sorted.length * .95)-1], maxMs: sorted.at(-1) };
};
assert(percentiles([5,1,3,2,4]).p95Ms === 5, 'Nearest-rank percentile check');

document.querySelector('#probe-prepare').onclick = async () => {
  try {
    assert(request.jobs.length === 3, 'Reload before preparing again');
    // Exercise real controls; the production component and shipped JS stay unchanged.
    document.querySelector('.add-job').open = true;
    for (let n = 1; n <= 27; n++) {
      document.querySelector('.add-job button').click();
      await afterRender();
      assert(select('Selected job').value === `batch-eval-${n}`, 'Preset was not accepted');
      change(select('Finish by (UTC)'), '24');
      await afterRender();
      request.jobs.push({ ...structuredClone(snapshot.jobs[0]), id: `batch-eval-${n}` });
    }
    change(select('Selected job'), 'batch-eval');
    await afterRender();
    assert(select('Selected job').options.length === 30, 'Expected maximum batch');
    assert(document.querySelectorAll('.heat-cell').length === 120, 'Expected 5 x 24 grid');
    verify(planScenario(request), 'batch-eval');
    armed = true;
    status('Ready: 30 jobs. Change priority, deadline or eligibility.');
    select('Scheduling priority').focus();
  } catch (error) { failures.push(String(error)); status(String(error)); }
};

function verify(result, selected) {
  assert(!document.querySelector('.draft-error'), 'Unexpected invalid draft');
  const dollars = n => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'}).format(n);
  for (const [id, policy] of Object.entries(result.policies)) {
    const cells = [...document.querySelector(`[data-testid="policy-${id}"]`).querySelectorAll('td')].map(e => e.textContent);
    assert(JSON.stringify(cells) === JSON.stringify([`${policy.totals.carbonKg.toFixed(2)} kg`, dollars(policy.totals.costUsd), `${policy.counts.planned} / 30`, String(policy.counts.unplaced)]), `Stale comparison: ${id}`);
  }
  const assignment = result.policies.regionAndTime.assignments.find(a => a.jobId === selected);
  const recommendation = document.querySelector('[data-testid="recommendation"]');
  assert(recommendation.querySelector('.eyebrow').textContent.startsWith(selected + ' /'), 'Stale selected job');
  if (assignment) {
    assert(recommendation.querySelector('h3 .mono')?.textContent === assignment.regionId, 'Stale region');
    const hour = h => `${String(h % 24).padStart(2,'0')}:00${h === 24 ? ' (+1d)' : ''}`;
    assert(recommendation.querySelector('.chosen-window')?.textContent.startsWith(`${hour(assignment.startSlot)}—${hour(assignment.endSlot)} UTC`), 'Stale window');
    const outlined = [...document.querySelectorAll('.heat-cell[data-assigned="true"]')];
    assert(outlined.length === assignment.endSlot - assignment.startSlot && outlined.every(c => c.getAttribute('aria-label').startsWith(assignment.regionId + ',') && c.getAttribute('aria-label').endsWith('selected job ' + selected)), 'Stale heatmap');
  } else assert(recommendation.classList.contains('no-placement'), 'Missing rejection');
}

// React handles checkbox changes during click, before the later native change event.
document.addEventListener('click', event => {
  if (armed && event.target.matches('.eligibility input')) eligibilityStart = event.timeStamp;
}, true);

document.addEventListener('change', async event => {
  if (!armed) return;
  const element = event.target;
  const isObjective = element === select('Scheduling priority');
  const isDeadline = element === select('Finish by (UTC)');
  const isEligibility = element.matches('.eligibility input');
  if (!isObjective && !isDeadline && !isEligibility) return;
  const start = isEligibility ? eligibilityStart : event.timeStamp;
  if (isEligibility) eligibilityStart = null;
  try {
    assert(Number.isFinite(start) && start <= event.timeStamp, 'Missing input-start timestamp');
    assert(event.isTrusted, 'Measured edits must be native trusted events');
    assert(!busy && document.visibilityState === 'visible', 'Overlapping edit or hidden tab');
    busy = true;
    const selected = select('Selected job').value;
    const job = request.jobs.find(j => j.id === selected);
    if (isObjective) request.objective = element.value;
    if (isDeadline) job.deadlineSlot = Number(element.value);
    if (isEligibility) job.eligibleRegionIds = [...document.querySelectorAll('.eligibility input:checked')].map(e => e.getAttribute('aria-label').replace('Allow ',''));
    await afterRender();
    const elapsedMs = performance.now() - start;
    // Oracle work stays outside the UI latency interval.
    const engineStart = performance.now();
    const expected = planScenario(request);
    const engineMs = performance.now() - engineStart;
    verify(expected, selected);
    samples.push({ kind: isObjective ? 'objective' : isDeadline ? 'deadline' : 'eligibility', startEvent: isEligibility ? 'click' : 'change', elapsedMs, engineMs, trusted: event.isTrusted, matched: true, objective: request.objective, job: structuredClone(job) });
    const summary = percentiles(samples.map(s => s.elapsedMs));
    status(`${samples.length} matched edits; p95 ${summary.p95Ms.toFixed(2)} ms; failures ${failures.length}`);
  } catch (error) { failures.push(String(error)); status(String(error)); }
  finally { busy = false; }
}, true);

document.querySelector('#probe-save').onclick = async () => {
  try {
    assert(samples.length >= 50 && !failures.length && !busy, 'Need >=50 successful edits and no failures');
    const summary = percentiles(samples.map(s => s.elapsedMs));
    const report = {
      measuredAt: new Date().toISOString(), userAgent: navigator.userAgent,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      profile: 'Unthrottled CPU and loopback HTTP; new origin port, Cache-Control no-store; foreground tab',
      protocol: 'Native trusted input event timestamp (capture-phase click for checkbox eligibility; change for selects) to requestAnimationFrame then timer task (post-render opportunity proxy, not a physical display/INP measurement); matching recommendation, heatmap and all three comparison rows checked after each sample. Oracle outside timed interval. No samples discarded.',
      budgetP95Ms: 100, passed: summary.p95Ms <= 100, summary,
      engineSummary: percentiles(samples.map(s => s.engineMs)), samples, failures,
      initialRequest: { ...structuredClone(request), jobs: [...structuredClone(snapshot.jobs), ...Array.from({length:27},(_,i) => ({...structuredClone(snapshot.jobs[0]), id:`batch-eval-${i+1}`}))], objective: snapshot.objective },
      navigation: performance.getEntriesByType('navigation').map(e => e.toJSON()),
      paint: performance.getEntriesByType('paint').map(e => e.toJSON()),
      resources: performance.getEntriesByType('resource').map(e => e.toJSON()),
    };
    const response = await fetch('/__report', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)});
    assert(response.ok, 'Report save failed');
    status(`SAVED ${samples.length} edits; p95 ${summary.p95Ms.toFixed(2)} ms; ${report.passed ? 'PASS' : 'FAIL'}`);
  } catch (error) { status(String(error)); }
};
