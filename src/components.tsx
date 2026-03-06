import { readFileSync } from 'node:fs';
import {
  CellNode,
  CellProps,
  ColumnNode,
  ColumnProps,
  GroupNode,
  GroupProps,
  ImageNode,
  ImageProps,
  RowNode,
  RowProps,
  TemplateNode,
  TemplateProps,
  WorkbookNode,
  WorkbookProps,
  WorksheetNode,
  WorksheetProps,
} from './types';

/**
 * Create the root workbook node for the render tree.
 */
export function Workbook(props: WorkbookProps): WorkbookNode {
  return { type: 'Workbook', props };
}

/**
 * Create a worksheet node with its ExcelJS options.
 */
export function Worksheet(props: WorksheetProps): WorksheetNode {
  return { type: 'Worksheet', props };
}

/**
 * Create a group node that can share style, format, and processor state.
 */
export function Group(props: GroupProps): GroupNode {
  return { type: 'Group', props };
}

/**
 * Create a column node for width, format, and named-range metadata.
 */
export function Column(props: ColumnProps): ColumnNode {
  return { type: 'Column', props };
}

/**
 * Create a row node that will be placed onto a worksheet grid.
 */
export function Row(props: RowProps): RowNode {
  return { type: 'Row', props };
}

/**
 * Create a cell node with value, style, and merge spans.
 */
export function Cell(props: CellProps): CellNode {
  return { type: 'Cell', props };
}

/**
 * Create a template node that expands rows from an XLSX source file.
 */
export function Template(props: TemplateProps): TemplateNode {
  return { type: 'Template', props };
}

/**
 * Create an image node, loading file contents eagerly when `src` is provided.
 */
export function Image(props: ImageProps): ImageNode {
  let buffer = props.buffer;
  if (!buffer && props.src) {
    buffer = readFileSync(props.src) as any;
  }
  return { type: 'Image', props: { ...props, buffer } };
}
