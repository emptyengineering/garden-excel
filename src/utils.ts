import * as ExcelJS from 'exceljs';
import {
  AnyNode,
  CellNode,
  ColumnNode,
  GroupNode,
  ImageNode,
  RowNode,
  WorkbookNode,
  WorksheetNode,
} from './types';

/**
 * Normalize a node's `children` prop into an array for traversal.
 */
export function getChildren(node: WorksheetNode | WorkbookNode | GroupNode | RowNode) {
  if (!node.props?.children) return undefined;

  if (Array.isArray(node.props.children)) {
    return node.props.children;
  }
  return [node.props.children];
}

/**
 * Return the formula declared on a column, row, or cell.
 */
export function getFormula(node: ColumnNode | RowNode | CellNode) {
  if (node.props.formula) {
    return node.props.formula;
  }
  return null;
}

/**
 * Return the number format declared on a column, row, or cell.
 */
export function getFormat(node: ColumnNode | RowNode | CellNode) {
  if (node.props.format) {
    return node.props.format;
  }
  return null;
}

/**
 * Assign a column width in ExcelJS units.
 */
export function setWidth(data: Pick<ExcelJS.Column, 'width'>, width: number) {
  data.width = width;
}

/**
 * Assign a number format on a cell or column.
 */
export function setFormat(
  data: Pick<ExcelJS.Cell, 'numFmt'> | Pick<ExcelJS.Column, 'numFmt'>,
  format: string,
) {
  data.numFmt = format;
}

/**
 * Return the explicit style object from a column, row, or cell.
 */
export function getStyle(node: ColumnNode | RowNode | CellNode) {
  if (node.props.style) {
    return node.props.style;
  }
}

/**
 * Apply an ExcelJS style object while leaving `numFmt` to dedicated format logic.
 */
export function setStyle(
  data: Pick<ExcelJS.Cell, 'style'> | Pick<ExcelJS.Column, 'style'>,
  style: Partial<ExcelJS.Style>,
) {
  // `numFmt` is handled separately so style merging does not overwrite format precedence.
  const styleWithoutNumFmt = { ...style };
  delete styleWithoutNumFmt.numFmt;
  data.style = styleWithoutNumFmt;
}

/**
 * Assign a cell value without touching styles, formulas, or formatting.
 */
export function setValue(data: ExcelJS.Cell, value: CellNode['props']['value']) {
  data.value = value;
}

/**
 * Narrow a node to an image node.
 */
export function isImage(node: AnyNode): node is ImageNode {
  return node.type === 'Image';
}

/**
 * Check whether a value can be used as a plain Excel cell result.
 */
export function isPrimitive(value: any): boolean {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date
  );
}

/**
 * Narrow a node to a workbook node.
 */
export function isWorkbook(node: AnyNode): node is WorkbookNode {
  return node.type === 'Workbook';
}

/**
 * Narrow a node to a worksheet node.
 */
export function isWorksheet(node: AnyNode): node is WorksheetNode {
  return node.type === 'Worksheet';
}

/**
 * Narrow a node to a group node.
 */
export function isGroup(node: AnyNode): node is GroupNode {
  return node.type === 'Group';
}

/**
 * Narrow a node to a row node.
 */
export function isRow(node: AnyNode): node is RowNode {
  return node.type === 'Row';
}

/**
 * Narrow a node to a cell node.
 */
export function isCell(node: AnyNode): node is CellNode {
  return node.type === 'Cell';
}

/**
 * Narrow a node to a column node.
 */
export function isColumn(node: AnyNode): node is ColumnNode {
  return node.type === 'Column';
}

/**
 * Check whether a value is a plain object suitable for deep merging.
 */
export function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Deep-merge plain objects with later sources overriding earlier ones.
 */
export function mergeDeep<T extends object = object>(...sources: any[]): T {
  const result: any = {};

  for (const source of sources) {
    if (isObject(source)) {
      for (const key in source) {
        const sourceValue = source[key];
        const resultValue = result[key];

        if (isObject(sourceValue) && isObject(resultValue)) {
          result[key] = mergeDeep(resultValue, sourceValue);
        } else {
          result[key] = sourceValue;
        }
      }
    }
  }
  return result as T;
}
