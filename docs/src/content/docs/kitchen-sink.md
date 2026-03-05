---
title: Kitchen Sink
description: A comprehensive example that uses most features.
---

This example combines components, styling, processors, templates, merges, and images into a single workbook.

```tsx
/** @jsxImportSource @workspace/excelwind */
import {
  Workbook,
  Worksheet,
  Column,
  Row,
  Cell,
  Group,
  Image,
  Template,
  render,
  tailwindExcel,
  mergeDeep,
  isRow,
  type Processor,
} from "@workspace/excelwind";

const zebraStripe: Processor = (node, ctx) => {
  if (!isRow(node) || ctx.rowIndex === undefined) return node;
  if (ctx.rowIndex % 2 === 0) return node;
  return {
    ...node,
    props: {
      ...node.props,
      style: mergeDeep(node.props.style, {
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "F3F4F6" } },
      }),
    },
  };
};

const workbook = await render(
  <Workbook>
    <Worksheet name="Overview" properties={{ tabColor: { argb: "1D4ED8" } }}>
      <Column width={24} />
      <Column width={14} format='"$"#,##0.00' />
      <Column width={14} />

      <Row height={28}>
        <Cell value="Excelwind Report" colSpan={3} style={tailwindExcel("font-bold text-xl text-center bg-blue-600 text-white")} />
      </Row>

      <Row>
        <Cell value="Region" style={tailwindExcel("font-bold bg-gray-100")} />
        <Cell value="Revenue" style={tailwindExcel("font-bold bg-gray-100 text-right")} />
        <Cell value="YoY" style={tailwindExcel("font-bold bg-gray-100 text-center")} />
      </Row>

      <Group processor={zebraStripe}>
        <Row>
          <Cell value="North" />
          <Cell value={12500} />
          <Cell value="+8%" style={tailwindExcel("text-center")} />
        </Row>
        <Row>
          <Cell value="South" />
          <Cell value={9800} />
          <Cell value="-2%" style={tailwindExcel("text-center")} />
        </Row>
        <Row>
          <Cell value="West" />
          <Cell value={15300} />
          <Cell value="+12%" style={tailwindExcel("text-center")} />
        </Row>
      </Group>

      <Row>
        <Cell value="Total" style={tailwindExcel("font-bold")} />
        <Cell formula="SUM(B3:B5)" value={37600} style={tailwindExcel("font-bold text-right")} />
        <Cell />
      </Row>

      <Row height={36}>
        <Cell value="Logo" />
        <Cell colSpan={2}>
          <Image src="./examples/assets/logo.png" extension="png" />
        </Cell>
      </Row>
    </Worksheet>

    <Worksheet name="Template">
      <Template
        src="./examples/assets/template.xlsx"
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
    </Worksheet>
  </Workbook>
);

await Bun.write("kitchen-sink.xlsx", await workbook.xlsx.writeBuffer());
```

Notes
- Update the image and template paths to match your project layout.
- The template sheet uses `Template` to duplicate a row based on `data.rows`.
