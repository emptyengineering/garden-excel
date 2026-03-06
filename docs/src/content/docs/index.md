---
title: Overview
description: Create Excel workbooks with JSX, no React required.
---

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/excelwind/branding/logo-dark.png" />
  <img src="/excelwind/branding/logo-light.png" alt="Excelwind logo" width="420" />
</picture>

Excelwind lets you generate Excel files using JSX syntax and Tailwind-style classes, backed by ExcelJS. It runs in JavaScript runtimes with Node compatibility and does not rely on React or any browser APIs.

## What you get
- Declarative JSX for worksheets, rows, and cells
- Tailwind-style utility classes via `className` or `excelwindClasses`
- Templates that load existing Excel files
- Images, named ranges, and processors for advanced layouts

## Installation
```bash
bun add @gavin-lynch/excelwind
```

## Basic usage
```tsx
/** @jsxImportSource @gavin-lynch/excelwind */
import { writeFile } from 'node:fs/promises';
import { Workbook, Worksheet, Row, Cell } from "@gavin-lynch/excelwind";
import { render } from "@gavin-lynch/excelwind";

const spreadsheet = (
  <Workbook>
    <Worksheet name="Sales">
      <Row>
        <Cell value="Product" className="font-bold bg-blue-600 text-white" />
        <Cell value="Revenue" className="font-bold bg-blue-600 text-white" />
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
await writeFile('output.xlsx', Buffer.from(buffer));
```
