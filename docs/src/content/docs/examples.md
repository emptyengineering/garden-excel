---
title: Examples
description: Browse the included examples and see what each one proves.
---

All examples generate `.xlsx` files in `examples/output/`.

The screenshots on this page come from `examples/expected/` and make the feature set easier to scan before you run anything locally.

```bash
bun run examples
```

Run individual examples:

```bash
bun run example:basic
bun run example:styling
bun run example:dynamic
bun run example:processors
bun run example:merged
bun run example:templates
bun run example:images
bun run example:complex-merge
```

## Example gallery

### 01. Basic workbook structure

![Basic workbook output](https://gavin-lynch.github.io/excelwind/examples/expected/output-01.png)

- Shows the minimum viable workbook: `Workbook`, `Worksheet`, `Column`, `Row`, and `Cell`
- Good first reference for column widths and plain value rendering
- Source: `examples/01-basic.tsx`
- Docs: [Workbook](/components/workbook/), [Worksheet](/components/worksheet/), [Cell](/components/cell/)

### 02. Styling with `className`

![Styling example output](https://gavin-lynch.github.io/excelwind/examples/expected/output-02.png)

- Shows shared header styling, row styling, borders, alignment, and formatted totals
- Demonstrates how `Group` lets you apply styling to several cells at once
- Source: `examples/02-styling.tsx`
- Docs: [Styling](/styling/), [Properties](/properties/), [Group](/components/group/)

### 03. Dynamic rows, formats, formulas, and named ranges

![Dynamic data output](https://gavin-lynch.github.io/excelwind/examples/expected/output-03.png)

- Maps data arrays directly into rows
- Uses column-level date and currency formatting
- Demonstrates named column ranges with `id` and formulas like `SUM(Salaries)`
- Source: `examples/03-dynamic-data.tsx`
- Docs: [Format](/format/), [Formula](/formula/), [Column](/components/column/)

### 04. Processors and conditional styling

![Processors example output](https://gavin-lynch.github.io/excelwind/examples/expected/output-04.png)

- Shows row processors applying zebra striping during render
- Combines processors with value-based styling for status cells
- Good reference for reusable render-time transformations
- Source: `examples/04-processors.tsx`
- Docs: [Processors](/processors/), [Group](/components/group/)

### 05. Merged cells and report layouts

![Merged cells example output](https://gavin-lynch.github.io/excelwind/examples/expected/output-05.png)

- Demonstrates `colSpan` and `rowSpan` in practical reporting layouts
- Shows section headers, vertically merged category labels, and merged summary blocks
- Source: `examples/05-merged-cells.tsx`
- Docs: [Merges](/merges/), [Cell](/components/cell/)

### 06. Templates and post-template content

![Template example output](https://gavin-lynch.github.io/excelwind/examples/expected/output-06.png)

- Loads an `.xlsx` template, expands the data row, then appends new JSX content below it
- Useful for invoice and branded document workflows
- Note: current template expansion targets row-based placeholders; non-row placeholders visible in the screenshot remain unchanged
- Source: `examples/06-templates.tsx`
- Docs: [Templates](/templates/), [Template](/components/template/)

### 07. Worksheet and cell-level images

![Images example output](https://gavin-lynch.github.io/excelwind/examples/expected/output-07.png)

- Embeds images from both base64 strings and files
- Demonstrates cell-child images with explicit positioning and sizing
- Source: `examples/07-images.tsx`
- Docs: [Images](/images/), [Image](/components/image/)

### 08. Advanced merge stress test

![Complex merge output](https://gavin-lynch.github.io/excelwind/examples/expected/output-08.png)

- Stresses mixed `rowSpan` and `colSpan` combinations in a single grid
- Helpful for validating dashboards, matrix layouts, and nested merge blocks
- Source: `examples/08-complex-merge.tsx`
- Docs: [Merges](/merges/), [Cell](/components/cell/)

## Best examples by feature

- `className` styling: `examples/02-styling.tsx`
- dynamic data + formulas: `examples/03-dynamic-data.tsx`
- processors: `examples/04-processors.tsx`
- practical merges: `examples/05-merged-cells.tsx`
- template-driven output: `examples/06-templates.tsx`
- image embedding: `examples/07-images.tsx`
- complex merge edge cases: `examples/08-complex-merge.tsx`
