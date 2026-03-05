---
title: API
description: Public exports and core types.
---

## Main exports
- `render(root)` -> returns an `ExcelJS.Workbook`
- `tailwindExcel(classString)` -> returns a partial ExcelJS style
- Components: `Workbook`, `Worksheet`, `Column`, `Row`, `Cell`, `Group`, `Image`, `Template`
- Utilities: `mergeDeep`, `isRow`, `isCell`, `isGroup`, `isColumn`, `isImage`, `isWorksheet`, `isWorkbook`

## Types
- `Processor(node, context)` -> transform nodes during rendering
- `ProcessorContext` -> { rowIndex, columnIndex, row }
- `WorkbookProps`, `WorksheetProps`, `RowProps`, `CellProps`, `ColumnProps`, `GroupProps`, `ImageProps`, `TemplateProps`

## Render contract
- The JSX tree is validated before render.
- `render` returns a workbook you can write via ExcelJS.
