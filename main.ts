import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from './parse.js';

type Case = { id: string; markdown: string };

const inputDir = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const raw = await readFile(join(inputDir, 'cases.json'), 'utf8');
const cases = JSON.parse(raw) as Case[];
const html: string[] = [];

for (const item of cases) {
  html.push(parse(item.markdown));
}

await writeFile(join(outputDir, 'html.json'), JSON.stringify(html));
