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
