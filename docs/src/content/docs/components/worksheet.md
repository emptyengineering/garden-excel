---
title: Worksheet
description: A sheet within a workbook.
---

`<Worksheet>` defines a single Excel sheet and its properties.

```tsx
<Worksheet name="Sheet1" properties={{ tabColor: { argb: "FF0000" } }}>
  ...
</Worksheet>
```

Props
- `name` (required)
- `properties` (optional): passed to ExcelJS worksheet properties

Notes
- Only `Column`, `Row`, `Group`, `Template`, and worksheet-level `Image` are valid direct children.
