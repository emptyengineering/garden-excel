---
title: Quick Start
description: Get from JSX to .xlsx in minutes.
---

## 1. Install
```bash
bun add @gavin-lynch/excelwind
```

## 2. Enable the JSX runtime
Use the JSX import source at the top of your file:
```tsx
/** @jsxImportSource @gavin-lynch/excelwind */
```

## 3. Render a workbook
```tsx
/** @jsxImportSource @gavin-lynch/excelwind */
import { writeFile } from 'node:fs/promises';
import { Workbook, Worksheet, Row, Cell, render } from "@gavin-lynch/excelwind";

const workbook = await render(
  <Workbook>
    <Worksheet name="Sheet1">
      <Row>
        <Cell value="Hello" className="font-bold" />
        <Cell value="World" className="text-right" />
      </Row>
    </Worksheet>
  </Workbook>
);

await writeFile('hello.xlsx', Buffer.from(await workbook.xlsx.writeBuffer()));
```

## 4. Next steps
- Add styles using `className`
- Extract repeated sections into components
- Use processors to apply conditional styling
