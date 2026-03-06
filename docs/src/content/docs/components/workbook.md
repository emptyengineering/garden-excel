---
title: Workbook
description: Root container for an Excel file.
---

`<Workbook>` is the root of every Excelwind tree. It holds one or more worksheets.

```tsx
<Workbook>
  <Worksheet name="Sheet1">...</Worksheet>
</Workbook>
```

Notes
- `<Workbook>` must be the root element.
- Use `render()` to produce an ExcelJS workbook.
