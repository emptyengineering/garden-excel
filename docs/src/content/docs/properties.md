---
title: Properties
description: Style properties mapped by tailwindExcel.
---

`tailwindExcel` maps utility classes into an ExcelJS `Style` object. It only sets the properties listed below.

## Mapped style properties
- `font.size`
- `font.bold`
- `font.italic`
- `font.underline`
- `font.color`
- `fill.type` (always `pattern`)
- `fill.pattern` (always `solid`)
- `fill.fgColor`
- `alignment.horizontal`
- `alignment.vertical`
- `alignment.wrapText`
- `border.{top|right|bottom|left}.style`
- `border.{top|right|bottom|left}.color`

## Default behavior
- If a property is not set by a class, ExcelJS defaults apply.
- `tailwindExcel` never sets `numFmt`; use the `format` prop instead.
