const { execFileSync } = require('node:child_process');
const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

const compiler = path.join(path.dirname(require.resolve('typescript/package.json')), 'bin/tsc');
execFileSync(process.execPath, [compiler, '-p', 'tsconfig.planner.json'], { cwd: root, stdio: 'inherit' });
mkdirSync(path.join(root, 'dist/planner'), { recursive: true });
writeFileSync(path.join(root, 'dist/planner/package.json'), '{"type":"module"}\n');
