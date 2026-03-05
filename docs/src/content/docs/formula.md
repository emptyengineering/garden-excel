---
title: Formula
description: Cell formulas and cached results.
---

Formulas are not part of `tailwindExcel`. Use the `formula` prop on `<Cell>`.

```tsx
<Cell formula="SUM(B2:B10)" value={1234} />
```

## Cached results
- If you also set `value`, it becomes the cached result Excel shows before recalculation.
- If you omit `value`, Excel will compute the result when the file is opened.

## Notes
- Formula strings are passed directly to ExcelJS without modification.
- ExcelJS writes the formula into the file, and Excel itself evaluates it on open.
- We adhere to Excel’s formula standards by passing through the string unchanged.
