import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { Cell, Column, Group, Row, render, Workbook, Worksheet } from '../src';
import { getDefinedNameRanges } from './utils';

async function renderAndReload(node: ReturnType<typeof Workbook>) {
  const workbook = await render(node);
  const buffer = await workbook.xlsx.writeBuffer();
  const reloaded = new ExcelJS.Workbook();
  await reloaded.xlsx.load(buffer);
  return reloaded;
}

describe('render integration', () => {
  it('renders values, styles, merges, and defined names', async () => {
    const workbook = await renderAndReload(
      Workbook({
        children: Worksheet({
          name: 'Report',
          children: [
            Column({ id: 'items' }),
            Column({ id: 'qty', format: '0' }),
            Column({ id: 'totals', format: '$0.00', className: 'text-right' }),
            Group({
              id: 'dataBlock',
              children: [
                Row({
                  id: 'headerRow',
                  className: 'text-center',
                  children: [
                    Cell({ value: 'Item' }),
                    Cell({ value: 'Qty' }),
                    Cell({ value: 'Total' }),
                  ],
                }),
                Row({
                  children: [
                    Cell({ value: 'Widget' }),
                    Cell({ value: 2 }),
                    Cell({
                      id: 'totalCell',
                      value: 19.99,
                      className: 'text-right',
                      style: { alignment: { horizontal: 'left' } },
                    }),
                  ],
                }),
                Row({
                  children: [Cell({ value: 'Merged', colSpan: 2 }), Cell({ value: 100 })],
                }),
              ],
            }),
          ],
        }),
      }),
    );

    const ws = workbook.getWorksheet('Report');
    expect(ws).toBeTruthy();
    if (!ws) return;

    expect(ws.getCell('A1').value).toBe('Item');
    expect(ws.getCell('B2').value).toBe(2);
    expect(ws.getCell('C2').value).toBe(19.99);
    expect(ws.getCell('C2').numFmt).toBe('$0.00');

    expect(ws.getCell('A1').alignment?.horizontal).toBe('center');
    expect(ws.getCell('C2').alignment?.horizontal).toBe('left');

    const merges = (ws as any)._merges || {};
    expect(Object.keys(merges)).toContain('A3');
    const mergeModel = merges.A3?.model;
    expect(mergeModel?.right).toBe(2);
    expect(mergeModel?.bottom).toBe(3);

    expect(getDefinedNameRanges(workbook, 'totalCell')).toEqual(['Report!$C$2']);
    expect(getDefinedNameRanges(workbook, 'totals')).toEqual(['Report!$C$1:$C$3']);
    expect(getDefinedNameRanges(workbook, 'dataBlock')).toEqual(['Report!$A$1:$C$3']);
  });
});
