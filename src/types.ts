import type { Buffer, CellValue, Style, WorksheetProperties } from 'exceljs';

// Base node structure
export interface BaseNode<T extends string, P> {
  type: T;
  props: P;
}

// Prop types
export interface WorkbookProps {
  children?: AnyNode | AnyNode[];
}

export interface WorksheetProps {
  name: string;
  properties?: Partial<WorksheetProperties>;
  children?: AnyNode | AnyNode[];
}

interface RenderProps {
  style?: Partial<Style>;
  formula?: string;
  format?: string;
}

export interface ColumnProps extends RenderProps {
  id?: string;
  width?: number;
  hidden?: boolean;
}

export interface GroupProps extends RenderProps {
  id?: string;
  style?: Partial<Style>;
  processor?: Processor;
  children?: AnyNode | AnyNode[];
}

export interface RowProps extends RenderProps {
  id?: string;
  style?: Partial<Style>;
  height?: number;
  children?: AnyNode | AnyNode[];
  formula?: string;
  format?: string;
}

export interface CellProps extends RenderProps {
  id?: string;
  value?: CellValue;
  colSpan?: number;
  rowSpan?: number;
  children?: AnyNode | AnyNode[];
  // Cell can now have children (e.g., for images)
}

export interface TemplateProps {
  src: string;
  data?: any;
  rangeRows?: number;
}

export interface ImageProps {
  src?: string;
  buffer?: Buffer | string; // Can be a Buffer or base64 string
  extension: 'jpeg' | 'png' | 'gif';
  range?: string; // e.g. 'A1:D10' or ExcelJS ImageRange
  position?: {
    tl: { col: number; row: number };
    ext: { width: number; height: number };
  };
  hyperlink?: string;
  tooltip?: string;
  // Add more ExcelJS image options as needed
}

// Node types
export type WorkbookNode = BaseNode<'Workbook', WorkbookProps>;
export type WorksheetNode = BaseNode<'Worksheet', WorksheetProps>;
export type GroupNode = BaseNode<'Group', GroupProps>;
export type ColumnNode = BaseNode<'Column', ColumnProps>;
export type RowNode = BaseNode<'Row', RowProps>;
export type CellNode = BaseNode<'Cell', CellProps>;
export type TemplateNode = BaseNode<'Template', TemplateProps>;
export type ImageNode = BaseNode<'Image', ImageProps>;

// Discriminated union of all possible nodes
export type AnyNode =
  | WorkbookNode
  | WorksheetNode
  | ColumnNode
  | GroupNode
  | RowNode
  | CellNode
  | ImageNode
  | TemplateNode;

// The context provided to a processor. Its properties are optional
// because they depend on what is being processed.
export interface ProcessorContext {
  rowIndex?: number;
  columnIndex?: number;
  row?: RowNode; // The parent row node for a cell
}

// A processor is a function that takes a node and its context,
// and returns a (potentially transformed) node.
export type Processor = (node: AnyNode, context: ProcessorContext) => AnyNode;
