---
title: Overview
description: Create Excel workbooks with JSX, no React required.
---

Excelwind lets you generate Excel files using JSX syntax and Tailwind-style classes, backed by ExcelJS. It runs in Node.js or Bun and does not rely on React or any browser APIs.

## What you get
- Declarative JSX for worksheets, rows, and cells
- Tailwind-style utility classes via `tailwindExcel`
- Templates that load existing Excel files
- Images, named ranges, and processors for advanced layouts

## Installation
```bash
bun add @workspace/excelwind
```

## Basic usage
```tsx
/** @jsxImportSource @workspace/excelwind */
import { Workbook, Worksheet, Row, Cell } from "@workspace/excelwind";
import { render, tailwindExcel } from "@workspace/excelwind";

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
