---
title: Cell
description: The atomic unit of a worksheet.
---

`<Cell>` represents one cell. It can be styled, merged, formatted, or hold a formula.

```tsx
<Cell value="Text" className="text-left" />
<Cell value={123} format='"$"#,##0.00' className="text-right" />
<Cell value="Merged" colSpan={2} rowSpan={2} className="text-center" />
```

Props
- `value` (optional)
- `formula` (optional)
- `format` (optional)
- `className` (optional)
- `colSpan` / `rowSpan` (optional)
- `id` (optional): creates a named range for this cell

Images
- You can nest `<Image>` inside a cell to position it in that cell.

Examples

![Merged cells example output](https://gavin-lynch.github.io/excelwind/examples/expected/output-05.png)

- `examples/05-merged-cells.tsx` shows practical `colSpan` and `rowSpan` usage in a report layout.
- `examples/08-complex-merge.tsx` pushes merge behavior further with overlapping row and column spans.
