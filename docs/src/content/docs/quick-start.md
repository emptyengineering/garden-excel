---
title: Quick Start
description: Get from JSX to .xlsx in minutes.
---

## 1. Install
```bash
bun add @workspace/excelwind
```

## 2. Enable the JSX runtime
Use the JSX import source at the top of your file:
```tsx
/** @jsxImportSource @workspace/excelwind */
```

## 3. Render a workbook
```tsx
/** @jsxImportSource @workspace/excelwind */
import { Workbook, Worksheet, Row, Cell, render } from "@workspace/excelwind";

const workbook = await render(
  <Workbook>
    <Worksheet name="Sheet1">
      <Row>
        <Cell value="Hello" />
        <Cell value="World" />
      </Row>
    </Worksheet>
  </Workbook>
);

await Bun.write("hello.xlsx", await workbook.xlsx.writeBuffer());
```

## 4. Next steps
- Add styles using `tailwindExcel`
- Extract repeated sections into components
- Use processors to apply conditional styling
