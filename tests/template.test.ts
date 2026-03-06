import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { Cell, Row, render, Template, Workbook, Worksheet } from '../src';
import { writeBufferToTempFile } from './utils';

async function renderAndReload(node: ReturnType<typeof Workbook>) {
  const workbook = await render(node);
  const buffer = await workbook.xlsx.writeBuffer();
  const reloaded = new ExcelJS.Workbook();
  await reloaded.xlsx.load(buffer);
  return reloaded;
}

describe('template rendering', () => {
  it('expands template rows and offsets formulas', async () => {
    const templateWorkbook = new ExcelJS.Workbook();
    const templateSheet = templateWorkbook.addWorksheet('Template');
    templateSheet.getCell('A1').value = 'Name';
    templateSheet.getCell('B1').value = 'Amount';
    templateSheet.getCell('A2').value = '{{name}}';
    templateSheet.getCell('B2').value = '{{amount}}';
    templateSheet.getCell('A3').value = 'Subtotal';
    templateSheet.getCell('B3').value = null;
    templateSheet.getCell('B3').value = { formula: 'SUM(B2:B2)' };
    const templateBuffer = await templateWorkbook.xlsx.writeBuffer();
    const templatePath = writeBufferToTempFile(Buffer.from(templateBuffer), 'xlsx');

    const workbook = await renderAndReload(
      Workbook({
        children: Worksheet({
          name: 'Output',
          children: [
            Row({ children: [Cell({ value: 'Start' })] }),
            Template({
              src: templatePath,
              data: {
                columns: [
                  { id: 'name', names: ['Name'] },
                  { id: 'amount', names: ['Amount'] },
                ],
                rows: [
                  { name: 'Ada', amount: 10 },
                  { name: 'Bob', amount: 15 },
                ],
              },
            }),
          ],
        }),
      }),
    );

    const ws = workbook.getWorksheet('Output');
    expect(ws).toBeTruthy();
    if (!ws) return;

    expect(ws.getCell('A1').value).toBe('Start');
    expect(ws.getCell('A2').value).toBe('Name');
    expect(ws.getCell('B2').value).toBe('Amount');
    expect(ws.getCell('A3').value).toBe('Ada');
    expect(ws.getCell('B3').value).toBe(10);
    expect(ws.getCell('A4').value).toBe('Bob');
    expect(ws.getCell('B4').value).toBe(15);
    expect(ws.getCell('A5').value).toBe('Subtotal');
    expect(ws.getCell('B5').formula).toBe('SUM(B3:B3)');
  });
});
