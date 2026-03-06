---
title: Images
description: Add images to worksheets or cells.
---

You can add images at the worksheet level or as children of a cell.

## Worksheet-level image
```tsx
<Worksheet name="Report">
  <Image src="./logo.png" extension="png" range="A1:C3" />
  ...
</Worksheet>
```

## Cell-level image
```tsx
<Row>
  <Cell value="Logo">
    <Image src="./logo.png" extension="png" />
  </Cell>
</Row>
```

## Positioning
Use `position` to specify exact bounds:
```tsx
<Image
  src="./logo.png"
  extension="png"
  position={{ tl: { col: 0, row: 0 }, ext: { width: 120, height: 48 } }}
/>
```

## See it in practice

![Images example output](https://gavin-lynch.github.io/excelwind/examples/expected/output-07.png)

- Source: `examples/07-images.tsx`
- Demonstrates base64-backed images, file-backed images, and cell-child images with explicit sizing

## Tips

- use worksheet-level images for logos, banners, and page decoration
- use cell-child images when an image conceptually belongs to a row of data
- specify `position` when you want predictable sizing instead of the default cell-based estimate
