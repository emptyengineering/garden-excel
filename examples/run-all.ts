/**
 * Run All Examples
 *
 * This script runs all example files and generates their output.
 * Run: npm run examples (or pnpm/bun equivalent)
 */

import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const examplesDir = new URL('.', import.meta.url).pathname;

async function runExample(file: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n📄 Running ${file}...`);
    const binary = process.platform === 'win32' ? 'tsx.cmd' : 'tsx';
    const proc = spawn(binary, [join(examplesDir, file)], {
      stdio: 'inherit',
      cwd: join(examplesDir, '..'),
      env: process.env,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${file} exited with code ${code}`));
      }
    });
  });
}

async function main() {
  console.log('🚀 Running all Excelwind examples...\n');

  const files = await readdir(examplesDir);
  const examples = files.filter((f) => f.endsWith('.tsx') && f.match(/^\d{2}-/)).sort();

  console.log(`Found ${examples.length} examples to run:`);
  examples.forEach((e) => {
    console.log(`  - ${e}`);
  });

  for (const example of examples) {
    try {
      await runExample(example);
    } catch (error) {
      console.error(`❌ Error running ${example}:`, error);
    }
  }

  console.log('\n✨ All examples completed!');
  console.log('📁 Output files are in: examples/output/');
}

main().catch(console.error);
