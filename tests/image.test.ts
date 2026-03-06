import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { Workbook, Worksheet, Image, render } from '../src';
import { bufferFromFixtureBase64 } from './utils';

async function renderAndReload(node: ReturnType<typeof Workbook>) {
  const workbook = await render(node);
  const buffer = await workbook.xlsx.writeBuffer();
  const reloaded = new ExcelJS.Workbook();
  await reloaded.xlsx.load(buffer);
  return reloaded;
}

describe('image rendering', () => {
  it('inserts images into the workbook', async () => {
    const imageBuffer = bufferFromFixtureBase64('tiny.png.base64');

    const workbook = await renderAndReload(
      Workbook({
        children: Worksheet({
          name: 'Images',
          children: [
            Image({
              buffer: imageBuffer as any,
              extension: 'png',
              range: 'A1:B2',
            }),
          ],
        }),
      }),
    );

    const ws = workbook.getWorksheet('Images');
    expect(ws).toBeTruthy();
    if (!ws) return;

    const images = ws.getImages();
    expect(images.length).toBeGreaterThan(0);
  });
});
