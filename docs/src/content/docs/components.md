---
title: Components
description: The JSX building blocks for Excelwind.
---

## Workbook
Root container for a file.
```tsx
<Workbook>...</Workbook>
```

## Worksheet
Defines a worksheet in the workbook.
```tsx
<Worksheet name="Sheet1" properties={{ tabColor: { argb: "FF0000" } }}>
  ...
</Worksheet>
```

## Column
Configures column width, format, or named ranges.
```tsx
<Column width={20} format='"$"#,##0.00' />
<Column id="Dates" width={15} format="yyyy-mm-dd" />
```

## Row
Defines a row of cells.
```tsx
<Row height={24}>
  <Cell value="Hello" />
</Row>
```

## Cell
Individual cell with value, format, spans, and optional images.
```tsx
<Cell value="Text" />
<Cell value={123} format='"$"#,##0.00' />
<Cell value="Merged" colSpan={2} rowSpan={2} />
```

## Group
Group rows or cells to share styles or processors.
```tsx
<Group style={tailwindExcel("bg-gray-100")}>...
</Group>
```

## Template
Loads an .xlsx file and expands data placeholders.
```tsx
<Template src="template.xlsx" data={{ columns: [], rows: [] }} />
```

## Image
Embeds an image either at worksheet level or inside a cell.
```tsx
<Image src="./logo.png" extension="png" range="A1:C3" />
```
