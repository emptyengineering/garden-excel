---
title: Group
description: Style and process groups of rows or cells.
---

`<Group>` is a powerful container that can:
- apply shared styles (`className` or `style`) to nested rows/cells
- run a processor over rows/cells
- create named ranges for formula use

```tsx
<Group className="bg-gray-100" processor={zebraStripe}>
  <Row>...</Row>
  <Row>...</Row>
</Group>
```

Style propagation
- `className` and `style` on a group are merged into all descendant rows/cells.
- This makes it easy to set section backgrounds, fonts, or borders in one place.

Processors
- A group can accept a `processor` to transform rows/cells during render.
- Useful for zebra striping, conditional styling, or data-driven transforms.

Named ranges
- If a `Group` has an `id`, Excelwind creates a named range spanning all rows rendered inside that group.
- The range covers the full row width from column A to the last column on the sheet.
- This enables formulas like `SUM(MyGroup)` or `COUNT(MyGroup)` against the grouped block.

Notes
- Groups can be nested.
- Groups can appear inside rows to style a subset of cells.

Example

![Processors example output](https://gavin-lynch.github.io/excelwind/examples/expected/output-04.png)

- `examples/04-processors.tsx` uses a `Group` processor for zebra striping and shared styling across an inventory table.
