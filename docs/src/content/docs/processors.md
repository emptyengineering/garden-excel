---
title: Processors
description: Transform nodes during render for dynamic styling.
---

Processors let you intercept rows or cells during rendering and return a modified node.

```ts
import type { Processor, ProcessorContext } from "@gavin-lynch/excelwind";
import { isRow, mergeDeep } from "@gavin-lynch/excelwind";

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

## What processors are good for

- zebra striping rows without repeating styles in every JSX node
- conditional cell formatting based on values or row position
- adding render-time transformations while keeping the JSX tree clean

## See it in practice

![Processors example output](https://gavin-lynch.github.io/excelwind/examples/expected/output-04.png)

- Source: `examples/04-processors.tsx`
- The example combines a row processor for striping with normal JSX logic for stock-status coloring

## Tips

- put processors on a `Group` when you want them to affect a repeated section
- use `ProcessorContext` for row and column position decisions
- return the original node unchanged when no transformation is needed
