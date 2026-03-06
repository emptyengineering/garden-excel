<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/public/branding/logo-dark.png" />
    <img src="docs/public/branding/logo-light.png" alt="Excelwind logo" width="420" />
  </picture>
</p>

# Excelwind

Excelwind is a declarative, JSX-based Excel generator with Excel formula support, Tailwind-style styling, Row/Column merging, Templating, and more.

It lets you build `.xlsx` files with a custom JSX runtime, ExcelJS under the hood, and a Tailwind-style `className` API for styling.

Is is designed for developer-friendly spreadsheet generation, styling, and templating.

## What You Get

- Declarative JSX for workbooks, worksheets, rows, cells, groups, images, and templates
- Tailwind-style utility classes via `className`
- Direct access to formatting, formulas, merges, named ranges, processors, and images
- Template-based workflows that start from existing `.xlsx` files
- A custom JSX runtime with TypeScript/LSP support and no React dependency
- Example workbooks and screenshots that show real output

## Table Of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Why Excelwind](#why-excelwind)
- [JSX Runtime Setup](#jsx-runtime-setup)
- [Core Concepts](#core-concepts)
- [Styling](#styling)
- [Mapped Style Properties](#mapped-style-properties)
- [Formats](#formats)
- [Formulas](#formulas)
- [Merges](#merges)
- [Processors](#processors)
- [Templates](#templates)
- [Images](#images)
- [Components](#components)
- [Examples](#examples)
- [API Summary](#api-summary)
- [Validation And Render Contract](#validation-and-render-contract)
- [Docs, Tests, And Local Development](#docs-tests-and-local-development)
- [Project Structure](#project-structure)
- [License](#license)

## Installation

```bash
bun add @gavin-lynch/excelwind
```

## Quick Start

```tsx
/** @jsxImportSource @gavin-lynch/excelwind */
import { writeFile } from 'node:fs/promises';
import { Workbook, Worksheet, Row, Cell, render } from '@gavin-lynch/excelwind';

const workbook = await render(
  <Workbook>
    <Worksheet name="Sheet1">
      <Row>
        <Cell value="Hello" className="font-bold" />
        <Cell value="World" className="text-right" />
      </Row>
    </Worksheet>
  </Workbook>,
);

await writeFile('hello.xlsx', Buffer.from(await workbook.xlsx.writeBuffer()));
```

## Why Excelwind

Excelwind is useful when you want spreadsheet output that is:

- easier to compose than manual ExcelJS row/cell mutation
- easier to style than raw ExcelJS style objects everywhere
- structured like a component tree instead of a giant imperative script
- still capable of advanced Excel features such as merges, formulas, templates, named ranges, and images

The project is especially suited to:

- reports
- exports from application data
- invoices and branded sheets
- dashboards and matrix-like layouts
- spreadsheets where JSX composition is a better fit than direct worksheet mutation

## JSX Runtime Setup

Excelwind uses a custom JSX runtime. It is not React.

At the top of your `.tsx` file, add:

```tsx
/** @jsxImportSource @gavin-lynch/excelwind */
```

TypeScript should use the automatic JSX runtime style. A typical configuration looks like:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@gavin-lynch/excelwind"
  }
}
```

This tells TypeScript to use Excelwind's runtime exports from:

- `@gavin-lynch/excelwind/jsx-runtime`
- `@gavin-lynch/excelwind/jsx-dev-runtime`

Excelwind also ships custom JSX type declarations so editors and LSPs understand that your JSX produces Excelwind nodes rather than React elements.

## Core Concepts

At render time, Excelwind turns a JSX tree into an `ExcelJS.Workbook`.

The main authoring model is:

- `Workbook` as the root
- `Worksheet` for sheets
- `Column` for column-wide settings
- `Row` for row structure
- `Cell` for values, formats, formulas, merges, and cell-level images
- `Group` for shared styling, processors, and named ranges
- `Image` for worksheet-level or cell-level image placement
- `Template` for importing and expanding existing `.xlsx` files

The render pipeline validates the JSX tree before rendering, then writes the final workbook through ExcelJS.

## Styling

`className` is the canonical styling API.

```tsx
<Cell value="Total" className="font-bold bg-blue-600 text-white text-right" />
```

For manual conversion, you can also use `excelwindClasses()`:

```tsx
import { excelwindClasses } from '@gavin-lynch/excelwind';

excelwindClasses('font-bold bg-blue-600 text-white text-right');
```

### Supported styling categories

#### Background colors

Use `bg-{color}-{shade}` to set a solid fill.

```tsx
excelwindClasses('bg-blue-600');
excelwindClasses('bg-slate-200');
```

#### Text colors

Use `text-{color}-{shade}` to set `font.color`.

```tsx
excelwindClasses('text-white');
excelwindClasses('text-emerald-700');
```

#### Font sizes

| Class | Size (pt) |
| --- | --- |
| `text-xs` | 10 |
| `text-sm` | 11 |
| `text-base` | 12 |
| `text-lg` | 14 |
| `text-xl` | 16 |
| `text-2xl` | 20 |
| `text-3xl` | 24 |
| `text-4xl` | 30 |

#### Font styles

| Class | Effect |
| --- | --- |
| `font-bold` | `font.bold = true` |
| `font-italic` | `font.italic = true` |
| `font-underline` | `font.underline = true` |

#### Alignment

Horizontal:

- `text-left`
- `text-center`
- `text-right`

Vertical:

- `align-top`
- `align-middle`
- `align-center`
- `align-bottom`

Wrapping:

- `text-wrap`
- `text-nowrap`

#### Borders

Borders are composed from multiple class fragments:

- sides: `border`, `border-t`, `border-r`, `border-b`, `border-l`, `border-x`, `border-y`
- style: `border-thin`, `border-thick`, `border-dotted`, `border-dashed`, `border-double`
- color: `border-{color}-{shade}`

Examples:

```tsx
excelwindClasses('border border-gray-300');
excelwindClasses('border-b border-dashed border-amber-600');
excelwindClasses('border-x border-thick');
```

### Styling rules and precedence

- `className` is preferred over manually writing style objects for common cases
- style merging happens in this order: column -> group -> row -> cell
- `style` still works and overrides the equivalent values from `className`
- unsupported classes throw an error so typos fail fast

## Mapped Style Properties

`excelwindClasses()` maps only these ExcelJS style fields:

- `font.size`
- `font.bold`
- `font.italic`
- `font.underline`
- `font.color`
- `fill.type`
- `fill.pattern`
- `fill.fgColor`
- `alignment.horizontal`
- `alignment.vertical`
- `alignment.wrapText`
- `border.{top|right|bottom|left}.style`
- `border.{top|right|bottom|left}.color`

It does not set `numFmt`. Use the `format` prop for number and date formatting.

## Formats

Number and date formatting are handled with the `format` prop, not `className`.

```tsx
<Column format='"$"#,##0.00' />
<Cell value={new Date()} format="yyyy-mm-dd" />
```

### Format precedence

- cell format wins over row, group, and column formats
- row or group formats apply only when a cell does not override them
- column formats provide convenient defaults for entire columns

Formats are written through ExcelJS `numFmt` and interpreted by Excel when the workbook is opened.

## Formulas

Use the `formula` prop on `Cell`.

```tsx
<Cell formula="SUM(B2:B10)" value={1234} />
```

### Cached results

- if `value` is also provided, it becomes the cached result Excel can show before recalculation
- if `value` is omitted, Excel computes the result when the file is opened

Formula strings are passed through to ExcelJS and Excel; Excelwind does not implement its own formula engine.

Named ranges can make formulas easier to read:

```tsx
<Column id="Salaries" format='"$"#,##0.00' />
<Cell formula="SUM(Salaries)" format='"$"#,##0.00' />
```

## Merges

Excelwind supports merged layouts directly with `colSpan` and `rowSpan` on `Cell`.

```tsx
<Row>
  <Cell value="Quarterly Sales Report 2024" colSpan={5} className="text-center font-bold" />
</Row>

<Row>
  <Cell value="Top Performers" rowSpan={2} className="align-center font-bold" />
  <Cell value="North America" colSpan={2} />
  <Cell value="570,000" colSpan={2} className="text-right" />
</Row>
```

### What merges are good for

- title rows that span the full width of a report
- multi-level headers
- summary blocks and dashboard cards
- vertically grouped category labels

### Merge placement behavior

- `colSpan` reserves cells to the right
- `rowSpan` reserves the same columns on following rows
- later cells are placed into the next available column automatically
- covered cells should not be authored explicitly; Excelwind skips over them while rendering

### Merge styling tips

- use borders intentionally if you want a visible grid around merged sections
- use `align-center` or `align-middle` on large merged headers
- use row or group styles when several merged cells share the same appearance

## Processors

Processors let you intercept nodes during render and return modified nodes.

They are useful for:

- zebra striping
- conditional styling
- value-based transformation
- reusable render-time rules that you do not want to repeat in every JSX node

Example:

```tsx
import { isRow, mergeDeep, type AnyNode, type Processor, type ProcessorContext } from '@gavin-lynch/excelwind';

const zebraStripe: Processor = (node: AnyNode, ctx: ProcessorContext) => {
  if (!isRow(node) || ctx.rowIndex === undefined) {
    return node;
  }

  if (ctx.rowIndex % 2 === 1) {
    return {
      ...node,
      props: {
        ...node.props,
        style: mergeDeep(node.props.style, {
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F3F4F6' },
          },
        }),
      },
    };
  }

  return node;
};

<Group processor={zebraStripe}>{data.map((item) => <Row>{/* ... */}</Row>)}</Group>;
```

### Processor context

`ProcessorContext` provides:

- `rowIndex`
- `columnIndex`
- `row`

Processors are commonly attached to `Group` so they apply to a repeated section of the tree.

## Templates

`Template` loads an existing `.xlsx` file and expands a placeholder row for each data item.

```tsx
<Template
  src="./template.xlsx"
  data={{
    columns: [
      { id: 'name', names: ['Name'] },
      { id: 'price', names: ['Price'] },
    ],
    rows: [
      { name: 'Widget', price: 10 },
      { name: 'Gadget', price: 20 },
    ],
  }}
/>
```

### How template expansion works

- Excelwind finds the header row that matches `columns[].names`
- the next row becomes the data template row
- that row is duplicated once per object in `data.rows`
- formulas in the template row are preserved and offset as rows expand

### Good use cases for templates

- invoices
- branded forms
- layouts that are easier to design visually in Excel first
- reports where static sheet structure already exists

### Current scope and limitation

Template expansion currently focuses on row-based placeholder duplication beneath a matched header row.

That means:

- row formulas are preserved and offset
- row-driven data expansion works
- placeholders elsewhere in the sheet are not automatically replaced yet

This is visible in the template example screenshot later in this README.

## Images

`Image` can be placed directly under `Worksheet` or nested inside `Cell`.

Worksheet-level image:

```tsx
<Worksheet name="Report">
  <Image src="./logo.png" extension="png" range="A1:C3" />
</Worksheet>
```

Cell-level image:

```tsx
<Row>
  <Cell value="Logo">
    <Image src="./logo.png" extension="png" />
  </Cell>
</Row>
```

Positioned image:

```tsx
<Image
  src="./logo.png"
  extension="png"
  position={{ tl: { col: 0, row: 0 }, ext: { width: 120, height: 48 } }}
/>
```

### Image notes

- images can come from `src`, `Buffer`, or base64-backed content
- if `position` is omitted for a cell image, Excelwind estimates a default size from row height and column width
- worksheet-level images are useful for banners and logos
- cell-level images are useful for catalog rows or record-specific thumbnails

## Components

### `<Workbook>`

Root container for every Excelwind tree.

```tsx
<Workbook>
  <Worksheet name="Sheet1">...</Worksheet>
</Workbook>
```

Notes:

- must be the root element
- rendered with `render()`

### `<Worksheet>`

Defines a single sheet and its ExcelJS worksheet properties.

```tsx
<Worksheet name="Sheet1" properties={{ tabColor: { argb: 'FF0000' } }}>
  ...
</Worksheet>
```

Props:

- `name` required
- `properties` optional

Direct children may be:

- `Column`
- `Row`
- `Group`
- `Template`
- worksheet-level `Image`

### `<Column>`

Defines column-wide settings.

```tsx
<Column width={20} format='"$"#,##0.00' className="text-right" />
<Column id="StartDates" width={15} format="yyyy-mm-dd" className="text-center" />
```

Props:

- `width`
- `format`
- `className`
- `style`
- `id`

If `id` is set, Excelwind creates a full-height named range for that column.

### `<Row>`

Groups cells into a single worksheet row.

```tsx
<Row height={24} className="bg-gray-50">
  <Cell value="Hello" className="font-bold" />
</Row>
```

Props:

- `height`
- `className`
- `style`
- `format`
- `id`

If `id` is set, Excelwind creates a named range for the rendered row.

### `<Cell>`

The atomic unit of worksheet content.

```tsx
<Cell value="Text" className="text-left" />
<Cell value={123} format='"$"#,##0.00' className="text-right" />
<Cell formula="SUM(A1:A10)" value={1234} />
<Cell value="Merged" colSpan={2} rowSpan={2} className="text-center" />
```

Props:

- `value`
- `formula`
- `format`
- `className`
- `style`
- `colSpan`
- `rowSpan`
- `id`

`Cell` can also contain child `Image` nodes.

### `<Group>`

Container for shared styling, formatting, processors, and named ranges.

```tsx
<Group className="bg-gray-100" processor={zebraStripe}>
  <Row>...</Row>
  <Row>...</Row>
</Group>
```

Useful behaviors:

- propagates `className` and `style` to descendants
- can run a processor across rows or cells in the subtree
- can create a named range if `id` is set
- can be nested
- can appear inside rows to style a subset of cells

If a `Group` has an `id`, its named range spans all rows rendered inside that group from column A to the last used column on the sheet.

### `<Image>`

Embeds images into worksheets or cells.

```tsx
<Image src="./logo.png" extension="png" range="A1:C3" />

<Image
  buffer={base64String}
  extension="png"
  position={{ tl: { col: 0, row: 0 }, ext: { width: 64, height: 64 } }}
  tooltip="Company Logo"
/>
```

Common props:

- `src`
- `buffer`
- `extension`
- `range`
- `position`
- `tooltip`
- `hyperlink`

### `<Template>`

Imports and expands a template workbook section.

```tsx
<Template
  src="template.xlsx"
  data={{
    columns: [
      { id: 'name', names: ['Name'] },
      { id: 'price', names: ['Price'] },
    ],
    rows: [
      { name: 'Widget', price: 100 },
    ],
  }}
/>
```

Use `Template` when sheet layout should begin from an existing Excel file rather than pure JSX.

## Examples

All examples write `.xlsx` files into `examples/output/`.

Run them all:

Bun is the primary local workflow.

```bash
bun run examples
```

Or individually:

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

### 01. Basic workbook structure

<img src="https://gavin-lynch.github.io/excelwind/examples/expected/output-01.png" alt="Basic workbook output" width="900" />

- source: `examples/01-basic.tsx`
- demonstrates the minimum viable workbook: `Workbook`, `Worksheet`, `Column`, `Row`, and `Cell`
- useful as the smallest end-to-end rendering example

### 02. Styling with `className`

<img src="https://gavin-lynch.github.io/excelwind/examples/expected/output-02.png" alt="Styling example output" width="900" />

- source: `examples/02-styling.tsx`
- demonstrates shared header styling, row styling, borders, alignment, `Group` propagation, and formatted totals
- best example for the Tailwind-style styling layer

### 03. Dynamic rows, formats, formulas, and named ranges

<img src="https://gavin-lynch.github.io/excelwind/examples/expected/output-03.png" alt="Dynamic data output" width="900" />

- source: `examples/03-dynamic-data.tsx`
- demonstrates array-driven rows, date and currency formats, named column ranges, and formulas like `SUM(Salaries)`
- good model for production export workflows

### 04. Processors and conditional styling

<img src="https://gavin-lynch.github.io/excelwind/examples/expected/output-04.png" alt="Processors example output" width="900" />

- source: `examples/04-processors.tsx`
- demonstrates zebra striping via processors and conditional status styling
- best example for render-time transformation patterns

### 05. Merged cells and report layouts

<img src="https://gavin-lynch.github.io/excelwind/examples/expected/output-05.png" alt="Merged cells example output" width="900" />

- source: `examples/05-merged-cells.tsx`
- demonstrates practical `colSpan` and `rowSpan` layouts in a report
- shows titles, summary bands, and vertically merged labels

### 06. Templates and post-template content

<img src="https://gavin-lynch.github.io/excelwind/examples/expected/output-06.png" alt="Template example output" width="900" />

- source: `examples/06-templates.tsx`
- demonstrates importing an invoice template, expanding line-item rows, and appending JSX content below the template
- also shows the current template limitation: non-row placeholders elsewhere in the sheet remain unchanged

### 07. Worksheet and cell-level images

<img src="https://gavin-lynch.github.io/excelwind/examples/expected/output-07.png" alt="Images example output" width="900" />

- source: `examples/07-images.tsx`
- demonstrates base64-backed images, file-backed images, and positioned images inside rows
- good reference for catalog or branded-sheet workflows

### 08. Advanced merge stress test

<img src="https://gavin-lynch.github.io/excelwind/examples/expected/output-08.png" alt="Complex merge output" width="900" />

- source: `examples/08-complex-merge.tsx`
- stresses mixed `rowSpan` and `colSpan` combinations in one sheet
- useful as a merge regression example and layout edge-case reference

### Best examples by topic

- styling: `examples/02-styling.tsx`
- dynamic data + formulas: `examples/03-dynamic-data.tsx`
- processors: `examples/04-processors.tsx`
- practical merges: `examples/05-merged-cells.tsx`
- templates: `examples/06-templates.tsx`
- images: `examples/07-images.tsx`
- merge edge cases: `examples/08-complex-merge.tsx`

## API Summary

### Main exports

- `render(root)` -> returns an `ExcelJS.Workbook`
- `excelwindClasses(classString)` -> returns a partial ExcelJS style object
- components: `Workbook`, `Worksheet`, `Column`, `Row`, `Cell`, `Group`, `Image`, `Template`
- utilities: `mergeDeep`, `isRow`, `isCell`, `isGroup`, `isColumn`, `isImage`, `isWorksheet`, `isWorkbook`

### Public types

- `Processor`
- `ProcessorContext`
- `WorkbookProps`
- `WorksheetProps`
- `ColumnProps`
- `RowProps`
- `CellProps`
- `GroupProps`
- `ImageProps`
- `TemplateProps`

### Entry point

Current top-level exports come from `src/index.ts`:

```ts
export * from './types';
export * from './components';
export * from './utils';
export { renderToWorkbook as render } from './renderRows';
export * from './className';
```

## Validation And Render Contract

- the JSX tree is validated before render
- invalid parent-child relationships throw early
- `Workbook` must be the root element
- `className` is the canonical styling prop for `Column`, `Group`, `Row`, and `Cell`
- `render()` returns an `ExcelJS.Workbook`, so writing the final file still uses ExcelJS methods like `workbook.xlsx.writeBuffer()`

## Docs, Tests, And Local Development

### Build the library

```bash
bun run build
```

### Run examples

```bash
bun run examples
```

### Run tests

```bash
bun run test
```

### Lint and format

```bash
bun run lint
bun run lint:fix
bun run format
```

### Run docs locally

```bash
bun run docs:dev
```

### Build docs

```bash
bun run docs:build
```

## Project Structure

```text
excelwind/
├── src/
│   ├── index.ts
│   ├── components.tsx
│   ├── renderRows.ts
│   ├── className.ts
│   ├── types.ts
│   ├── utils.ts
│   ├── validate.ts
│   ├── jsx-types.d.ts
│   └── jsx-runtime/
│       ├── jsx-runtime.ts
│       └── jsx-dev-runtime.ts
├── tests/
├── examples/
│   ├── 01-basic.tsx
│   ├── 02-styling.tsx
│   ├── 03-dynamic-data.tsx
│   ├── 04-processors.tsx
│   ├── 05-merged-cells.tsx
│   ├── 06-templates.tsx
│   ├── 07-images.tsx
│   ├── 08-complex-merge.tsx
│   ├── expected/
│   ├── output/
│   └── assets/
├── docs/
└── package.json
```

## License

MIT
