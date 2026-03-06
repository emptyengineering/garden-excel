---
title: Image
description: Embed images in worksheets or cells.
---

`<Image>` embeds an image either at the worksheet level or inside a cell.

```tsx
<Image src="./logo.png" extension="png" range="A1:C3" />
```

Cell-level images
```tsx
<Cell value="Logo">
  <Image src="./logo.png" extension="png" />
</Cell>
```

Notes
- If `position` is omitted for a cell image, Excelwind estimates a default size based on row height and column width.

Example

![Images example output](https://gavin-lynch.github.io/excelwind/examples/expected/output-07.png)

- `examples/07-images.tsx` shows file-backed and base64-backed images placed inside table rows.
