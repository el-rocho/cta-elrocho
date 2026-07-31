import { isDeepStrictEqual } from 'node:util';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const workspaceDir = resolve(scriptDir, '..', '..');
const editions = [
  ['individual', join(workspaceDir, 'cta-elrocho')],
  ['cliente', join(workspaceDir, 'cta-elrocho-cliente')],
  ['autoalojada', join(workspaceDir, 'cta-elrocho-selfhosted')],
];
const npmCli = process.env.npm_execpath;
const tempDir = mkdtempSync(join(tmpdir(), 'cta-edition-parity-'));

function findDifferences(left, right, path = 'result', differences = [], limit = 20) {
  if (differences.length >= limit || isDeepStrictEqual(left, right)) return differences;
  if (Array.isArray(left) && Array.isArray(right)) {
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index += 1) {
      findDifferences(left[index], right[index], `${path}[${index}]`, differences, limit);
    }
    return differences;
  }
  if (left && right && typeof left === 'object' && typeof right === 'object') {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    for (const key of [...keys].sort()) {
      findDifferences(left[key], right[key], `${path}.${key}`, differences, limit);
    }
    return differences;
  }
  differences.push({ path, left, right });
  return differences;
}

try {
  const results = [];
  for (const [name, repo] of editions) {
    if (!existsSync(join(repo, 'package.json'))) {
      throw new Error(`No se encontró la edición ${name} en ${repo}`);
    }
    const outputPath = join(tempDir, `${name}.json`);
    const command = npmCli ? process.execPath : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
    const args = npmCli
      ? [npmCli, 'test', '--', 'src/utils/editionCharacterization.test.ts']
      : ['test', '--', 'src/utils/editionCharacterization.test.ts'];
    const run = spawnSync(
      command,
      args,
      {
        cwd: repo,
        env: { ...process.env, CTA_CHARACTERIZATION_OUTPUT: outputPath },
        stdio: 'inherit',
      }
    );
    if (run.error) throw run.error;
    if (run.status !== 0) {
      throw new Error(`Las pruebas de caracterización fallaron en la edición ${name}.`);
    }
    results.push([name, JSON.parse(readFileSync(outputPath, 'utf8'))]);
  }

  const [referenceName, reference] = results[0];
  for (const [name, result] of results.slice(1)) {
    if (!isDeepStrictEqual(reference, result)) {
      const differences = findDifferences(reference, result);
      throw new Error(
        `Diferencias entre ${referenceName} y ${name}:\n` +
        differences
          .map((difference) =>
            `${difference.path}: ${JSON.stringify(difference.left)} !== ${JSON.stringify(difference.right)}`
          )
          .join('\n')
      );
    }
  }

  console.log('✓ Resultados clínicos equivalentes en individual, cliente y autoalojada.');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
