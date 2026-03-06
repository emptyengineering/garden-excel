---
title: Template
description: Load and expand .xlsx templates.
---

`<Template>` loads an existing `.xlsx` file and expands a placeholder row for each data item.

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

How it works
- Finds the header row matching `columns[].names`.
- Uses the next row as the data template.
- Duplicates that row once per item in `data.rows`.

Notes
- Template formulas are preserved and offset as rows expand.

Example

![Template example output](https://gavin-lynch.github.io/excelwind/examples/expected/output-06.png)

- `examples/06-templates.tsx` shows a template-driven invoice with JSX rows appended after the imported sheet content.
