# Excelwind

A JSX-based Excel generator for Node.js. Create, compose, and style Excel spreadsheets using familiar JSX syntax and Tailwind-style class names—no React or browser required.

## ✨ Features

- **JSX Syntax** - Write Excel spreadsheets as declarative JSX components
- **Tailwind-style Styling** - Use utility classes like `bg-blue-500`, `font-bold`, `border`
- **Custom Components** - `<Workbook>`, `<Worksheet>`, `<Row>`, `<Cell>`, `<Column>`, `<Group>`, `<Image>`, `<Template>`
- **Templates** - Load and populate existing Excel templates
- **Images** - Embed images from files or base64 data
- **Processors** - Transform nodes during rendering (e.g., zebra striping)
- **No React** - Custom JSX runtime designed for Excel generation

## 📦 Installation

```bash
bun add @workspace/excelwind
```

## 🚀 Quick Start

```tsx
/** @jsxImportSource @workspace/excelwind */
import { Workbook, Worksheet, Row, Cell } from "@workspace/excelwind";
import { render } from "@workspace/excelwind";
import { tailwindExcel } from "@workspace/excelwind";

const spreadsheet = (
  <Workbook>
    <Worksheet name="Sales">
      <Row>
        <Cell value="Product" style={tailwindExcel("font-bold bg-blue-600 text-white")} />
        <Cell value="Revenue" style={tailwindExcel("font-bold bg-blue-600 text-white")} />
      </Row>
      <Row>
        <Cell value="Widget Pro" />
        <Cell value={15000} />
      </Row>
    </Worksheet>
  </Workbook>
);

const workbook = await render(spreadsheet);
const buffer = await workbook.xlsx.writeBuffer();
await Bun.write("output.xlsx", buffer);
```

## 📚 Examples

Run all examples to see the full capabilities:

```bash
# Run all examples
bun run examples

# Or run individual examples
bun run example:basic       # Basic workbook creation
bun run example:styling     # Tailwind-style classes
bun run example:dynamic     # Dynamic data generation
bun run example:processors  # Custom row processors
bun run example:merged      # Cell merging (colSpan/rowSpan)
bun run example:templates   # Excel templates
bun run example:images      # Embedded images
```

Output files are generated in `examples/output/`.

## 📖 Documentation

Local docs are built with Astro Starlight.

```bash
bun install --cwd docs
bun run docs:dev
```

## 🎨 Styling with Tailwind Classes

Use the `tailwindExcel()` utility to convert Tailwind-style classes to Excel styles:

```tsx
import { tailwindExcel } from "@workspace/excelwind";

// Colors
tailwindExcel("bg-blue-500 text-white")

// Typography
tailwindExcel("font-bold text-lg text-center")

// Borders
tailwindExcel("border border-gray-300 border-thick")

// Alignment
tailwindExcel("text-left align-center")

// Combined
tailwindExcel("font-bold bg-indigo-600 text-white text-center border-b")
```

### Supported Classes

| Category | Classes |
|----------|---------|
| Background | `bg-{color}-{100-900}` |
| Text Color | `text-{color}-{100-900}` |
| Font | `font-bold`, `text-sm`, `text-lg`, `text-xl`, `text-2xl` |
| Alignment | `text-left`, `text-center`, `text-right`, `align-top`, `align-center`, `align-bottom` |
| Borders | `border`, `border-{t,r,b,l,x,y}`, `border-{color}-{shade}`, `border-thick` |
| Text Wrap | `text-nowrap` |

## 📋 Components

### `<Workbook>`
Root container for the Excel file.

### `<Worksheet>`
A sheet within the workbook.

```tsx
<Worksheet name="Sheet1" properties={{ tabColor: { argb: "FF0000" } }}>
  {/* rows and columns */}
</Worksheet>
```

### `<Column>`
Define column properties.

```tsx
<Column width={20} format='"$"#,##0.00' style={tailwindExcel("text-right")} />
<Column id="Dates" width={15} format="yyyy-mm-dd" />
```

### `<Row>`
A row of cells.

```tsx
<Row height={30}>
  <Cell value="Hello" />
</Row>
```

### `<Cell>`
Individual cell with value and styling.

```tsx
<Cell value="Text" />
<Cell value={12345} format='"$"#,##0.00' />
<Cell value={new Date()} />
<Cell formula="SUM(A1:A10)" />
<Cell value="Merged" colSpan={3} rowSpan={2} />
```

### `<Group>`
Group cells/rows for shared styling or processing.

```tsx
<Group style={tailwindExcel("bg-gray-100")} processor={zebraStripeProcessor}>
  {rows.map(row => <Row>...</Row>)}
</Group>
```

### `<Image>`
Embed images in cells.

```tsx
<Image
  src="./logo.png"
  extension="png"
  position={{ tl: { col: 0, row: 0 }, ext: { width: 100, height: 50 } }}
  tooltip="Company Logo"
/>

<Image
  buffer={base64String}
  extension="png"
  position={{ tl: { col: 0, row: 0 }, ext: { width: 64, height: 64 } }}
/>
```

### `<Template>`
Load and populate Excel templates.

```tsx
<Template
  src="template.xlsx"
  data={{
    company: { name: "Acme Corp" },
    rows: [{ item: "Widget", price: 100 }]
  }}
/>
```

## 🔄 Processors

Processors transform nodes during rendering. Useful for conditional styling:

```tsx
import { Processor, AnyNode, ProcessorContext } from "@workspace/excelwind";
import { isRow, mergeDeep } from "@workspace/excelwind";

const zebraStripe: Processor = (node: AnyNode, ctx: ProcessorContext) => {
  if (!isRow(node) || ctx.rowIndex === undefined) return node;
  
  if (ctx.rowIndex % 2 === 1) {
    return {
      ...node,
      props: {
        ...node.props,
        style: mergeDeep(node.props.style, {
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: "F3F4F6" } }
        })
      }
    };
  }
  return node;
};

<Group processor={zebraStripe}>
  {data.map(item => <Row>...</Row>)}
</Group>
```

## 📁 Project Structure

```
excelwind/
├── src/
│   ├── index.ts          # Main exports
│   ├── components.tsx    # JSX components
│   ├── renderRows.ts     # Rendering engine
│   ├── tailwind.ts       # Tailwind class parser
│   ├── types.ts          # TypeScript types
│   ├── utils.ts          # Utility functions
│   └── jsx-runtime/      # Custom JSX runtime
├── examples/
│   ├── 01-basic.tsx
│   ├── 02-styling.tsx
│   ├── 03-dynamic-data.tsx
│   ├── 04-processors.tsx
│   ├── 05-merged-cells.tsx
│   ├── 06-templates.tsx
│   ├── 07-images.tsx
│   ├── run-all.ts
│   ├── assets/           # Template files and images
│   └── output/           # Generated Excel files
└── package.json
```

## 📝 License

MIT
