import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { OBSERVATION_COMPAT_MODULES } from './observation-compat-policy.mjs';

const sourceDirectory = resolve('src/legacy/observations');
const outputDirectory = resolve('dist/lib');

await mkdir(outputDirectory, { recursive: true });
await Promise.all(OBSERVATION_COMPAT_MODULES.map((moduleName) => (
  copyFile(
    resolve(sourceDirectory, moduleName),
    resolve(outputDirectory, moduleName),
  )
)));

console.log(`Emitted ${OBSERVATION_COMPAT_MODULES.length} Observation compatibility modules from the canonical bundled source.`);
