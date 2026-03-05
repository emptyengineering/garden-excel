---
title: Format
description: Number and date formatting for cells and columns.
---

Number/date formatting is not handled by `tailwindExcel`. Use the `format` prop on `<Cell>` or `<Column>`.

```tsx
<Column format='"$"#,##0.00' />
<Cell value={new Date()} format="yyyy-mm-dd" />
```

## Precedence
- If both column and cell formats are set, the cell format wins.
- Row or group formats only apply if a cell does not override them.

## Notes
- Formats use Excel’s number format syntax.
- Formats are applied via ExcelJS `numFmt` and then interpreted by Excel when the file is opened.
- We rely on ExcelJS for wiring the format string and on Excel itself to evaluate it, so behavior follows Excel standards.
