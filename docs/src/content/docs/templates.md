---
title: Templates
description: Load .xlsx files and fill data placeholders.
---

Templates load an existing Excel file and expand a data row for each data item.

```tsx
<Template
  src="./template.xlsx"
  data={{
    columns: [
      { id: "name", names: ["Name"] },
      { id: "price", names: ["Price"] },
    ],
    rows: [
      { name: "Widget", price: 10 },
      { name: "Gadget", price: 20 },
    ],
  }}
/>
```

## How it works
- The template scans for a header row that matches `columns[].names`.
- The next row is treated as the placeholder row.
- That row is duplicated once per data item.

## Tips
- Keep the placeholder row directly beneath the header row.
- Use cell formulas in your template; they are preserved and offset.
