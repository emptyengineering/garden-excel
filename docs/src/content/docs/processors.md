---
title: Processors
description: Transform nodes during render for dynamic styling.
---

Processors let you intercept rows or cells during rendering and return a modified node.

```ts
import type { Processor, ProcessorContext } from "@workspace/excelwind";
import { isRow, mergeDeep } from "@workspace/excelwind";

const zebraStripe: Processor = (node, ctx: ProcessorContext) => {
  if (!isRow(node) || ctx.rowIndex === undefined) return node;
  if (ctx.rowIndex % 2 === 1) {
    return {
      ...node,
      props: {
        ...node.props,
        style: mergeDeep(node.props.style, {
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: "F3F4F6" } },
        }),
      },
    };
  }
  return node;
};
```

Apply the processor to a group:
```tsx
<Group processor={zebraStripe}>...</Group>
```
