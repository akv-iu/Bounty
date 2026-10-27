const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { planScenario, validateScenario, ScenarioValidationError, ScenarioArithmeticError } = require('../dist/planner/index.js');
const request = JSON.parse(readFileSync(path.join(__dirname, '../data/scenario.json'), 'utf8'));
const before = structuredClone(request);
assert.equal(validateScenario(request).ok, true);
const result = planScenario(request);
assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
assert.deepEqual(request, before);
assert.deepEqual(planScenario(request), result);
for (const policy of Object.values(result.policies)) {
  assert.equal(policy.counts.submitted, 3);
  assert.equal(policy.counts.planned + policy.counts.unplaced, 3);
  assert.equal(policy.assignments.length, policy.counts.planned);
}
assert.throws(() => planScenario({ ...request, schemaVersion: 0 }), ScenarioValidationError);
assert.equal(typeof ScenarioArithmeticError, 'function');
console.log('Standalone Node smoke passed: public exports, three policies, JSON round trip, repeated results and unchanged input.');
