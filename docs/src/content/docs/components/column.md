---
title: Column
description: Column width, format, and named range support.
---

`<Column>` defines column settings for the worksheet.

```tsx
<Column width={20} format='"$"#,##0.00' className="text-right" />
<Column id="StartDates" width={15} format="yyyy-mm-dd" className="text-center" />
```

Props
- `width` (optional)
- `format` (optional)
- `className` (optional): applies styles to every cell in the column
- `id` (optional): creates a named range for the column

Named ranges
- If `id` is set, Excelwind defines a column range using the worksheet name and the full column height.
- This allows formulas like `SUM(Salaries)` to work.
