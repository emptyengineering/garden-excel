import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type ExcelJS from 'exceljs';

export const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

export function loadFixtureBase64(fixtureName: string) {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const fixturePath = resolve(currentDir, 'fixtures', fixtureName);
  return readFileSync(fixturePath, 'utf8').trim();
}

export function bufferFromFixtureBase64(fixtureName: string) {
  return Buffer.from(loadFixtureBase64(fixtureName), 'base64');
}

export function writeBufferToTempFile(buffer: Buffer, extension: string) {
  const filePath = join(tmpdir(), `excelwind-${Date.now()}.${extension}`);
  writeFileSync(filePath, buffer);
  return filePath;
}

export function writeFixtureToTempFile(fixtureName: string, extension: string) {
  const buffer = bufferFromFixtureBase64(fixtureName);
  const safeName = fixtureName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const filePath = join(tmpdir(), `excelwind-${safeName}-${Date.now()}.${extension}`);
  writeFileSync(filePath, buffer);
  return filePath;
}

export function getCell(ws: ExcelJS.Worksheet, address: string) {
  return ws.getCell(address);
}

export function getDefinedNameRanges(workbook: ExcelJS.Workbook, name: string): string[] {
  const definedNames = workbook.definedNames as any;
  if (definedNames?.getRanges) {
    return definedNames.getRanges(name)?.ranges ?? [];
  }
  const model = definedNames?.model as any;
  if (Array.isArray(model)) {
    const found = model.find((entry) => entry.name === name);
    return found?.ranges ?? [];
  }
  if (model?.names?.[name]) {
    return model.names[name];
  }
  return [];
}
