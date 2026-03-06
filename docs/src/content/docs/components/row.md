---
title: Row
description: A row of cells.
---

`<Row>` groups cells into a single row and can apply shared styling.

```tsx
<Row height={24} className="bg-gray-50">
  <Cell value="Hello" className="font-bold" />
</Row>
```

Props
- `height` (optional)
- `className` (optional): applies styles to every cell in the row
- `id` (optional): creates a named range for this row

Notes
- `Row` can be nested inside `Group`.
