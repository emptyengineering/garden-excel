import type { CellValue } from 'exceljs';
import ExcelJS from 'exceljs';
import { excelwindClasses } from './className';
import {
  type AnyNode,
  type CellNode,
  type ChildNode,
  type ColumnNode,
  ImageNode,
  type Processor,
  type RowNode,
} from './types';
import {
  getFormat,
  isCell,
  isColumn,
  isGroup,
  isImage,
  isPrimitive,
  isRow,
  mergeDeep,
  setFormat,
  setStyle,
  setWidth,
} from './utils';
import { validateTree } from './validate';

interface RenderContext {
  workbook: ExcelJS.Workbook;
  sheet?: ExcelJS.Worksheet;
  styles: ExcelJS.Style[];
  processors: Processor[];
  // Track the last occupied row for each column while handling row spans.
  rowSpanState?: { [col: number]: number };
  currentRow?: number;
  columnFormats?: (string | undefined)[];
  columnStyles?: (Partial<ExcelJS.Style> | undefined)[];
  groupFormat?: string;
}

/**
 * Convert a `className` string into an ExcelJS style object.
 */
function classNameToStyle(className?: string) {
  if (!className) return undefined;
  return excelwindClasses(className);
}

/**
 * Render a single row node into its final worksheet cells.
 *
 * The row render pipeline flattens nested groups, resolves row and cell
 * processors, applies merges, and writes defined names.
 */
function renderRow(rowNode: RowNode, context: RenderContext) {
  const {
    sheet,
    workbook,
    rowSpanState,
    currentRow,
    columnFormats = [],
    columnStyles = [],
    groupFormat,
  } = context;
  let processedRowNode: RowNode = { ...rowNode };
  const rowIndex = currentRow;

  // Run processors before flattening so they can reshape the row.
  context.processors.forEach((processor) => {
    const p = processor(processedRowNode, { rowIndex });
    if (isRow(p)) {
      processedRowNode = p;
    }
  });

  const { props } = processedRowNode;
  const rowClassStyle = classNameToStyle(props.className);
  const initialStyle = mergeDeep(...context.styles, rowClassStyle, props.style);

  const allCells: { node: CellNode; groupFormat?: string }[] = [];

  /**
   * Flatten nested groups into a linear list of cells while preserving
   * inherited styles and formats.
   */
  function flatten(children: ChildNode, inheritedStyle: any, inheritedFormat?: string) {
    if (!children) return;
    const childrenArray = Array.isArray(children) ? children : [children];
    childrenArray.forEach((child) => {
      if (!child || !('type' in child)) return;
      if (isGroup(child)) {
        const groupClassStyle = classNameToStyle(child.props.className);
        const groupStyle = mergeDeep(inheritedStyle, groupClassStyle, child.props.style);
        const groupFormat = child.props.format || inheritedFormat;
        flatten(child.props.children, groupStyle, groupFormat);
      } else if (isCell(child)) {
        const cellClassStyle = classNameToStyle(child.props.className);
        const finalCellStyle = mergeDeep(inheritedStyle, cellClassStyle, child.props.style);
        allCells.push({
          node: { ...child, props: { ...child.props, style: finalCellStyle } },
          groupFormat: inheritedFormat,
        });
      }
    });
  }

  if ('children' in props) {
    flatten(props.children, initialStyle, groupFormat);
  }

  if (allCells.length === 0) {
    // Skip empty rows produced by processors or conditional rendering.
    return;
  }

  // Remove row-span reservations that ended before this row.
  if (rowSpanState && rowIndex !== undefined) {
    for (const col in rowSpanState) {
      if (rowSpanState[col] < rowIndex) {
        delete rowSpanState[col];
      }
    }
  }

  // Place cells into the next available columns, skipping active row spans.
  const placedCells: { node: CellNode; col: number; groupFormat?: string }[] = [];
  let columnIndex = 1;
  for (const { node, groupFormat } of allCells) {
    while (rowSpanState?.[columnIndex]) {
      columnIndex++;
    }

    // Run processors with row and column context once placement is known.
    let processedCellNode = node;
    context.processors.forEach((processor) => {
      const p = processor(processedCellNode, {
        row: processedRowNode,
        rowIndex,
        columnIndex,
      });
      if (isCell(p)) {
        processedCellNode = p;
      }
    });

    placedCells.push({
      node: processedCellNode,
      col: columnIndex,
      groupFormat,
    });

    const { colSpan = 1, rowSpan = 1 } = processedCellNode.props;
    if (rowSpan > 1 && rowSpanState && rowIndex !== undefined) {
      for (let i = 0; i < colSpan; i++) {
        rowSpanState[columnIndex + i] = rowIndex + rowSpan - 1;
      }
    }
    columnIndex += colSpan;
  }

  const maxPlacedCol = placedCells.reduce(
    (max, cell) => Math.max(max, cell.col + (cell.node.props.colSpan || 1) - 1),
    0,
  );
  const maxRowSpanCol = rowSpanState
    ? Object.keys(rowSpanState).reduce((max, col) => Math.max(max, parseInt(col, 10)), 0)
    : 0;
  const maxCol = Math.max(maxPlacedCol, maxRowSpanCol);

  const values = new Array(maxCol).fill(null);
  placedCells.forEach((cell) => {
    values[cell.col - 1] = cell.node.props.value;
  });

  if (!sheet || rowIndex === undefined) return;
  const excelRow = sheet.getRow(rowIndex);

  if (props.id) {
    const range = `'${sheet.name}'!$${excelRow.number}:$${excelRow.number}`;
    workbook.definedNames.add(range, props.id);
  }

  if (props.height) {
    excelRow.height = props.height;
  }

  // Apply values, styles, formats, merges, and child images cell by cell.
  placedCells.forEach(({ node, col, groupFormat }) => {
    const cell: ExcelJS.Cell = excelRow.getCell(col);
    const colFormat = columnFormats[col - 1];
    const colStyle = columnStyles[col - 1];
    // Formula cells may also carry a cached primitive result.
    if (node.props.formula) {
      const v = node.props.value;
      cell.value = { formula: node.props.formula };
      if (v !== undefined && isPrimitive(v)) {
        cell.value = Object.assign({}, cell.value, { result: v });
      }
    } else if (node.props.value !== undefined) {
      cell.value = node.props.value;
    }
    // Style precedence is column -> group -> row -> cell.
    const rowStyle = processedRowNode.props.style;
    const mergedStyle = mergeDeep(
      colStyle,
      groupFormat ? {} : {},
      rowStyle,
      node.props.style || {},
    );
    setStyle(cell, mergedStyle);
    // Format precedence mirrors the explicit render hierarchy.
    const rowFormat = getFormat(processedRowNode);
    const cellFormat = getFormat(node);
    const format = cellFormat || rowFormat || groupFormat || colFormat;

    if (format) {
      setFormat(cell, format);
      cell.numFmt = format;
    }

    const { colSpan = 1, rowSpan = 1 } = node.props;
    if (rowSpan > 1 || colSpan > 1) {
      sheet.mergeCells(excelRow.number, col, excelRow.number + rowSpan - 1, col + colSpan - 1);
    }

    if (node.props.id) {
      const range = `'${sheet.name}'!${cell.address}`;
      workbook.definedNames.add(range, node.props.id);
    }

    if (node.props.children) {
      const children = Array.isArray(node.props.children)
        ? node.props.children
        : [node.props.children];
      for (const child of children) {
        if (child && !Array.isArray(child) && child.type === 'Image') {
          // Derive a fallback image position from the current cell box.
          const imageNode = { ...child };
          if (!imageNode.props.position) {
            // ExcelJS column widths are character-based, so this is approximate.
            const colWidth = sheet.getColumn(col).width || 8;
            const rowHeight = excelRow.height || sheet.properties.defaultRowHeight || 15;
            imageNode.props.position = {
              tl: { col, row: excelRow.number },
              ext: {
                width: Math.round(colWidth * 7),
                height: Math.round(rowHeight),
              },
            };
          }
          renderImage(imageNode, context);
        }
      }
    }
  });
}

/**
 * Apply declared column widths and number formats before rows are rendered.
 */
function applyColumnDefinitions(columnNodes: ColumnNode[], sheet: ExcelJS.Worksheet) {
  if (columnNodes.length > 0) {
    sheet.columns = columnNodes.map((node: ColumnNode) => {
      const col: Pick<ExcelJS.Column, 'width' | 'numFmt'> = {};
      if (node.props.width) {
        setWidth(col, node.props.width);
      }
      if (node.props.format) {
        setFormat(col, node.props.format);
      }
      return col;
    });
  }
}

/**
 * Register column-level defined names after row rendering determines height.
 */
function populateColumnDefinedNames(
  columnNodes: ColumnNode[],
  workbook: ExcelJS.Workbook,
  sheet: ExcelJS.Worksheet,
) {
  const lastRow = sheet.rowCount;
  if (!lastRow) return;

  columnNodes.forEach((node, index) => {
    if (!node.props.id) return;
    const colLetter = sheet.getColumn(index + 1).letter;
    const range = `'${sheet.name}'!$${colLetter}$1:$${colLetter}$${lastRow}`;
    workbook.definedNames.add(range, node.props.id);
  });
}

/**
 * Insert an image into the worksheet using either a range or absolute position.
 */
function renderImage(imageNode: ImageNode, context: RenderContext) {
  const { buffer, extension, range, position, hyperlink, tooltip } = imageNode.props;
  const { sheet, workbook } = context;

  if (!sheet || !workbook || !buffer) return;

  // Normalize supported buffer inputs into a Node.js Buffer for ExcelJS.
  let buf: Buffer;
  if (typeof buffer === 'string') {
    buf = Buffer.from(buffer, 'base64');
  } else if (buffer instanceof Buffer) {
    buf = buffer;
  } else if (buffer instanceof Uint8Array) {
    buf = Buffer.from(Uint8Array.prototype.slice.call(buffer)) as any as Buffer;
  } else {
    return;
  }

  const imageId = workbook.addImage({
    buffer: buf as any,
    extension,
  });

  if (range) {
    sheet.addImage(imageId, range as any);
  } else if (position) {
    sheet.addImage(imageId, {
      tl: position.tl,
      ext: position.ext,
      hyperlinks: hyperlink ? { hyperlink, tooltip } : undefined,
    });
  }
}

/**
 * Walk the evaluated node tree and emit workbook content.
 */
function render(node: ChildNode, context: RenderContext) {
  if (!node) return;

  const nodes = Array.isArray(node)
    ? node.filter((n): n is AnyNode => !!n && !Array.isArray(n))
    : [node].filter((n): n is AnyNode => !!n && !Array.isArray(n));

  /**
   * Recursively find rows inside worksheet and group children, carrying forward
   * inherited styles, processors, formats, and current row position.
   */
  const findAndRenderRows = (
    nodesToSearch: ChildNode,
    currentContext: RenderContext,
    groupFormat?: string,
  ) => {
    if (!nodesToSearch) return;
    const searchArray = Array.isArray(nodesToSearch)
      ? nodesToSearch.filter((n): n is AnyNode => !!n && !Array.isArray(n))
      : [nodesToSearch].filter((n): n is AnyNode => !!n && !Array.isArray(n));

    let currentRow = currentContext.currentRow || 1;
    const rowSpanState = currentContext.rowSpanState || {};

    searchArray.forEach((n) => {
      if (isRow(n)) {
        if (!currentContext.sheet) {
          throw new Error('Sheet is required to render rows');
        }
        renderRow(n, {
          ...currentContext,
          sheet: currentContext.sheet,
          currentRow,
          rowSpanState,
          groupFormat,
        });
        currentRow++;
      } else if (isGroup(n)) {
        const groupContext: RenderContext = {
          ...currentContext,
          styles: [
            ...currentContext.styles,
            classNameToStyle(n.props.className),
            n.props.style,
          ].filter(Boolean) as ExcelJS.Style[],
          processors: [...currentContext.processors, n.props.processor].filter(
            (p): p is Processor => !!p,
          ),
          rowSpanState,
          currentRow,
          groupFormat: n.props.format || currentContext.groupFormat,
        };

        if (n.props.id && groupContext.sheet) {
          const groupSheet = groupContext.sheet;
          const firstRow = groupContext.currentRow ?? currentRow;

          findAndRenderRows(n.props.children, groupContext, groupContext.groupFormat);

          currentRow = groupContext.currentRow ?? currentRow;

          const lastRow = currentRow - 1;
          if (lastRow >= firstRow) {
            const firstCol = 'A';
            const lastCol = groupSheet.getColumn(groupSheet.columnCount).letter;
            const range = `'${groupSheet.name}'!$${firstCol}$${firstRow}:$${lastCol}$${lastRow}`;
            context.workbook.definedNames.add(range, n.props.id);
          }
        } else {
          findAndRenderRows(n.props.children, groupContext, groupContext.groupFormat);
          currentRow = groupContext.currentRow ?? currentRow;
        }
      }
    });
    currentContext.currentRow = currentRow;
  };

  for (const child of nodes) {
    if (!child) continue;

    if (child.type === 'Workbook') {
      render(child.props.children, context);
    } else if (child.type === 'Worksheet') {
      // Precompute column-level defaults before row rendering begins.
      const children = Array.isArray(child.props.children)
        ? child.props.children.filter((n): n is AnyNode => !!n && !Array.isArray(n))
        : [child.props.children].filter((n): n is AnyNode => !!n && !Array.isArray(n));
      const columnNodes = children.filter(
        (child): child is ColumnNode => !!child && isColumn(child),
      );
      const columnFormats = columnNodes.map((col: ColumnNode) => col.props.format);
      const columnStyles = columnNodes.map((col: ColumnNode) =>
        mergeDeep(classNameToStyle(col.props.className), col.props.style),
      );
      const sheet = context.workbook.addWorksheet(child.props.name, {
        properties: child.props.properties,
      });
      applyColumnDefinitions(columnNodes, sheet);
      const newSheetContext: RenderContext = {
        ...context,
        sheet,
        rowSpanState: {},
        columnFormats,
        columnStyles,
      };

      // Render worksheet-scoped images before processing row content.
      const imageNodes = children.filter((n): n is ImageNode => !!n && isImage(n));
      for (const imageNode of imageNodes) {
        renderImage(imageNode, { ...newSheetContext, sheet });
      }

      // Image nodes are handled separately from row traversal.
      const nonImageChildren = children.filter((n) => !isImage(n));
      findAndRenderRows(nonImageChildren, newSheetContext);
      populateColumnDefinedNames(columnNodes, context.workbook, sheet);
    } else if (isImage(child)) {
    } else {
      throw new Error(`Unknown node type: ${child.type}`);
    }
  }
}

/**
 * Offset row references in an Excel formula by a row delta.
 *
 * This is used when template content is inserted lower in the destination
 * worksheet and formulas need to keep pointing at the same logical rows.
 *
 * @param formula - The original Excel formula
 * @param rowOffset - The number of rows to offset, positive or negative
 * @returns The formula with row references shifted
 */
function offsetFormulaReferences(formula: string, rowOffset: number): string {
  if (rowOffset === 0) return formula;
  return formula.replace(/([A-Z]+)(\d+)/g, (match, col, row) => {
    const newRow = Number.parseInt(row, 10) + rowOffset;
    if (newRow < 1) {
      console.warn(`[Formula Offset] Row ${newRow} would be invalid, keeping original: ${match}`);
      return match;
    }
    return col + newRow;
  });
}

/**
 * Expand single-cell references into vertical ranges.
 *
 * For example, increasing `E15` by `6` produces `E15:E21`.
 *
 * @param formula - The original Excel formula
 * @param rangeRows - The number of additional rows to include in the range
 * @returns The formula with expanded vertical ranges
 */
function _expandFormulaRanges(formula: string, rangeRows: number): string {
  if (rangeRows <= 0) return formula;

  return formula.replace(/([A-Z]+)(\d+)(?::[A-Z]+\d+)?/g, (match, col, row) => {
    const startRow = Number.parseInt(row, 10);
    const endRow = startRow + rangeRows;
    if (endRow < startRow) {
      console.warn(
        `[Formula Range] Invalid range ${startRow}:${endRow}, keeping original: ${match}`,
      );
      return match;
    }
    return `${col}${startRow}:${col}${endRow}`;
  });
}

/**
 * Convert an ExcelJS worksheet into row, cell, and image nodes.
 *
 * This is used by template rendering so imported sheets can flow back through
 * the same renderer as hand-authored JSX trees.
 */
async function worksheetToNodes(ws: ExcelJS.Worksheet, rowOffset: number = 0): Promise<AnyNode[]> {
  const rows: RowNode[] = [];

  // Map each merge's top-left cell to its rectangle for quick lookup.
  const mergeRects: Record<string, { left: number; top: number; right: number; bottom: number }> =
    {};
  const mergesObj = (ws as any)._merges || {};
  for (const [topLeft, rangeObj] of Object.entries(mergesObj)) {
    const model = (rangeObj as any).model;
    mergeRects[topLeft] = {
      left: model.left,
      top: model.top,
      right: model.right,
      bottom: model.bottom,
    };
  }

  // Iterate by row index so template empty rows are preserved.
  for (let rowNumber = 1; rowNumber <= ws.rowCount; rowNumber++) {
    const row = ws.getRow(rowNumber);
    const cells: (CellNode | null)[] = [];
    for (let colNumber = 1; colNumber <= ws.columnCount; colNumber++) {
      const cell = row.getCell(colNumber);
      const address = cell.address;
      // Only emit merged cells once, from their top-left anchor.
      if (mergeRects[address]) {
        const rect = mergeRects[address];
        const colSpan = rect.right - rect.left + 1;
        const rowSpan = rect.bottom - rect.top + 1;
        const style = cell.style || {};
        const format = cell.numFmt;
        const formula = cell.formula;
        const value = cell.value;
        const cellProps: any = {
          value,
          style,
          ...(format ? { format } : {}),
          ...(formula ? { formula: offsetFormulaReferences(formula, rowOffset) } : {}),
        };
        if (colSpan > 1) cellProps.colSpan = colSpan;
        if (rowSpan > 1) cellProps.rowSpan = rowSpan;
        cells.push({
          type: 'Cell',
          props: cellProps,
        });
        continue;
      }
      // Skip cells that belong to a merge already emitted elsewhere.
      let isCovered = false;
      for (const rect of Object.values(mergeRects)) {
        if (
          rowNumber >= rect.top &&
          rowNumber <= rect.bottom &&
          colNumber >= rect.left &&
          colNumber <= rect.right
        ) {
          // Exclude non-anchor cells that fall inside a merged rectangle.
          if (!(rowNumber === rect.top && colNumber === rect.left)) {
            isCovered = true;
            break;
          }
        }
      }
      if (isCovered) {
        cells.push(null);
        continue;
      }
      // Preserve unmerged cells as regular cell nodes.
      const style = cell.style || {};
      const format = cell.numFmt;
      const formula = cell.formula;
      const value = cell.value;
      const cellProps: any = {
        value,
        style,
        ...(format ? { format } : {}),
        ...(formula ? { formula: offsetFormulaReferences(formula, rowOffset) } : {}),
      };
      cells.push({
        type: 'Cell',
        props: cellProps,
      });
    }
    // Preserve empty rows so imported templates keep their spacing.
    const _hasNonEmptyCell = cells.some(
      (cell) =>
        cell &&
        cell.props.value !== null &&
        cell.props.value !== undefined &&
        cell.props.value !== '',
    );
    rows.push({
      type: 'Row',
      props: {
        children: cells.filter((c): c is CellNode => c !== null),
      },
    });
  }
  // Extract worksheet images after rows so both can be returned together.
  const imageNodes: ImageNode[] = [];
  if (typeof ws.getImages === 'function') {
    const images = ws.getImages();
    for (const img of images) {
      const workbook = ws.workbook as ExcelJS.Workbook;
      if (typeof workbook.getImage === 'function') {
        const image = workbook.getImage(img.imageId as any);
        if (image?.buffer && image.extension) {
          // Normalize image payloads so they can be re-rendered later.
          let buf: Buffer;
          if (image.buffer instanceof Buffer) {
            buf = image.buffer;
          } else if (image.buffer instanceof Uint8Array) {
            buf = Buffer.from(Uint8Array.prototype.slice.call(image.buffer)) as any as Buffer;
          } else if (typeof image.buffer === 'string') {
            buf = Buffer.from(image.buffer, 'base64');
          } else {
            continue;
          }
          imageNodes.push({
            type: 'Image',
            props: {
              buffer: buf as any,
              extension: image.extension,
              range: img.range as any,
            },
          });
        }
      }
    }
  }
  return [...rows, ...imageNodes];
}

interface EvaluationContext {
  currentRow: number;
}

/**
 * Evaluate template nodes and recurse through child trees.
 *
 * Template nodes load XLSX content and expand into ordinary render nodes so
 * the rest of the pipeline can treat them like handwritten JSX.
 */
async function evaluate(
  node: any,
  context: EvaluationContext,
): Promise<AnyNode | AnyNode[] | null> {
  if (!node) return null;
  if (Array.isArray(node)) {
    const result: AnyNode[] = [];
    for (const n of node) {
      const evaluated = await evaluate(n, context);
      if (Array.isArray(evaluated)) {
        result.push(...evaluated);
      } else if (evaluated) {
        result.push(evaluated);
      }
    }
    return result;
  }

  if (node.type === 'Template') {
    // Load the source workbook and convert its first sheet into render nodes.
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(node.props.src);
    const ws = wb.worksheets[0];

    if (node.props.data) {
      // Expand placeholder rows before converting the sheet back into nodes.
      const { expandedRows, rowStartIndex } = expandTemplateRows(
        ws,
        node.props.data,
        '{{',
        '}}',
        node.props.rangeRows || 0,
      );
      if (rowStartIndex !== -1) {
        ws.spliceRows(rowStartIndex, 1, ...expandedRows);
      }
    }

    // Offset imported formulas so they stay aligned after insertion.
    const rows = await worksheetToNodes(ws, context.currentRow - 1);
    context.currentRow += rows.length;
    return rows;
  }

  if (node.type === 'Row') {
    context.currentRow++;
  }

  if (node.props?.children) {
    const children = await evaluate(node.props.children, context);
    return { ...node, props: { ...node.props, children } };
  }
  return node;
}

/**
 * Render a workbook node tree into an ExcelJS workbook instance.
 *
 * This first expands template nodes, validates the final tree shape, then runs
 * the normal renderer over the evaluated node graph.
 *
 * @param root - The workbook node tree to render
 * @returns A populated ExcelJS workbook
 */
export async function renderToWorkbook(root: any): Promise<ExcelJS.Workbook> {
  const evaluatedTree = await evaluate(root, { currentRow: 1 });
  if (evaluatedTree) {
    validateTree(evaluatedTree);
  }

  const workbook = new ExcelJS.Workbook();
  render(evaluatedTree as AnyNode, {
    workbook,
    styles: [],
    processors: [],
    columnFormats: [],
    columnStyles: [],
    groupFormat: '',
  });

  return workbook;
}

/**
 * Expand a template worksheet's placeholder row into concrete data rows.
 *
 * The template is discovered by matching header labels first, then locating the
 * following row that contains `{{placeholder}}` expressions.
 *
 * @param ws - The ExcelJS worksheet to inspect
 * @param data - Template metadata and row values used for expansion
 * @param openPlaceholder - Reserved for custom placeholder delimiters
 * @param closePlaceholder - Reserved for custom placeholder delimiters
 * @param rangeRows - Reserved for future range-expansion behavior
 * @returns The expanded row values and the row index that should be replaced
 */
function expandTemplateRows(
  ws: ExcelJS.Worksheet,
  data: any,
  _openPlaceholder = '{{',
  _closePlaceholder = '}}',
  _rangeRows: number = 0,
): { expandedRows: CellValue[][]; rowStartIndex: number } {
  const placeholderRegex = /\{\{\s*(.*?)\s*\}\}/;
  const columnsConfig = data.columns || [];
  const template = {
    columns: { matches: 0, rowStartIndex: -1, colStartIndex: -1 },
    rows: { matches: 0, rowStartIndex: -1, colStartIndex: -1 },
  };

  // Locate the header row by matching configured column names.
  for (let rowNumber = 1; rowNumber <= ws.rowCount; rowNumber++) {
    const row = ws.getRow(rowNumber);
    const values = row.values;
    const cellValues: any[] = Array.isArray(values) ? values.slice(1) : [];

    for (const [colIdx, val] of cellValues.entries()) {
      if (!val || typeof val !== 'string') {
        continue;
      }
      for (const h of columnsConfig) {
        if (h.names?.includes(val)) {
          template.columns.matches++;
          if (template.columns.rowStartIndex === -1) {
            template.columns.rowStartIndex = rowNumber;
            template.columns.colStartIndex = colIdx;
          }
        }
      }
    }
  }

  // Locate the placeholder row immediately below the header row.
  if (template.columns.rowStartIndex !== -1) {
    const row = ws.getRow(template.columns.rowStartIndex + 1);
    const values = row.values;
    const cellValues: CellValue[] = Array.isArray(values) ? values.slice(1) : [];

    for (const [colIdx, val] of cellValues.entries()) {
      if (!val || typeof val !== 'string') {
        continue;
      }
      if (placeholderRegex.test(val)) {
        template.rows.matches++;
        if (template.rows.rowStartIndex === -1) {
          template.rows.rowStartIndex = template.columns.rowStartIndex + 1;
          template.rows.colStartIndex = colIdx;
        }
      }
    }
  }

  if (template.columns.matches === 0) throw new Error('Columns template row not found');
  if (template.rows.matches === 0) throw new Error('Data template row not found');

  /**
   * Replace a single placeholder inside a cell value.
   */
  function _replacePlaceholders(cell: ExcelJS.Cell, obj: any) {
    if (typeof cell.value === 'string') {
      const match = cell.value.match(placeholderRegex);
      if (match) {
        cell.value = obj[match[1]];
      }
    }
  }

  // Materialize each data object as a new row based on the template row shape.
  const expandedRows: CellValue[][] = [];
  for (let rowNumber = 1; rowNumber <= ws.rowCount; rowNumber++) {
    if (rowNumber === template.rows.rowStartIndex) {
      // Replace the template row with one row per input object.
      for (const [i, _row] of data.rows.entries()) {
        const templateRow = ws.getRow(template.rows.rowStartIndex);
        const newRow: CellValue[] = [];
        templateRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const key = data.columns[colNumber - 1]?.id;
          cell.value = data.rows[i][key];
          newRow[colNumber - 1] = cell.value;
        });
        expandedRows.push(newRow);
      }
    }
  }
  return { expandedRows, rowStartIndex: template.rows.rowStartIndex };
}
