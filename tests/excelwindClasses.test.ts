import { describe, expect, it } from 'vitest';
import { excelwindClasses } from '../src/className';

describe('excelwindClasses', () => {
  it('maps font size and styles', () => {
    const style = excelwindClasses('text-xl font-bold font-italic font-underline');
    expect(style.font?.size).toBe(16);
    expect(style.font?.bold).toBe(true);
    expect(style.font?.italic).toBe(true);
    expect(style.font?.underline).toBe(true);
  });

  it('maps colors', () => {
    const style = excelwindClasses('text-white bg-black');
    expect(style.font?.color?.argb).toBe('FFFFFF');
    expect((style.fill as any)?.fgColor?.argb).toBe('000000');
  });

  it('maps alignment and wrapping', () => {
    const style = excelwindClasses('text-right align-top text-wrap');
    expect(style.alignment?.horizontal).toBe('right');
    expect(style.alignment?.vertical).toBe('top');
    expect(style.alignment?.wrapText).toBe(true);
  });

  it('maps borders', () => {
    const style = excelwindClasses('border-x border-blue-200');
    expect(style.border?.left?.style).toBe('thin');
    expect(style.border?.right?.style).toBe('thin');
    expect(style.border?.left?.color?.argb).toBe('BEDBFF');
    expect(style.border?.right?.color?.argb).toBe('BEDBFF');
  });

  it('throws on unknown classes', () => {
    expect(() => excelwindClasses('not-a-class')).toThrow('Unknown or unsupported class');
  });
});
