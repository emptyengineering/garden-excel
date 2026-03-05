import {
  CellNode,
  ColumnNode,
  GroupNode,
  RowNode,
  WorksheetNode,
  WorkbookNode,
  WorkbookProps,
  WorksheetProps,
  GroupProps,
  ColumnProps,
  RowProps,
  CellProps,
  ImageProps,
  TemplateProps,
  ImageNode,
  TemplateNode,
} from "./types";
import { readFileSync } from "fs";

export function Workbook(props: WorkbookProps): WorkbookNode {
  return { type: "Workbook", props };
}

export function Worksheet(props: WorksheetProps): WorksheetNode {
  return { type: "Worksheet", props };
}

export function Group(props: GroupProps): GroupNode {
  return { type: "Group", props };
}

export function Column(props: ColumnProps): ColumnNode {
  return { type: "Column", props };
}

export function Row(props: RowProps): RowNode {
  return { type: "Row", props };
}

export function Cell(props: CellProps): CellNode {
  return { type: "Cell", props };
}

export function Template(props: TemplateProps): TemplateNode {
  return { type: "Template", props };
}

export function Image(props: ImageProps): ImageNode {
  let buffer = props.buffer;
  if (!buffer && props.src) {
    buffer = readFileSync(props.src);
  }
  return { type: "Image", props: { ...props, buffer } };
}
