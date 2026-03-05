import ExcelJS from 'exceljs';
import { mergeDeep } from './utils';
import { validateTree } from './validate';
import {
  type AnyNode,
  type Processor,
  type RowNode,
  type WorksheetNode,
  type ColumnNode,
  type CellNode,
  ImageNode,
} from './types';
import {
  getFormat,
  setFormat,
  setStyle,
  setWidth,
  isCell,
  isColumn,
  isGroup,
  isRow,
  isPrimitive,
  isImage,
} from './utils';
import type { CellValue } from 'exceljs';

interface RenderContext {
  workbook: ExcelJS.Workbook;
  sheet?: ExcelJS.Worksheet;
  styles: ExcelJS.Style[];
  processors: Processor[];
  rowSpanState?: { [col: number]: number }; // End row for a span on a given column
  currentRow?: number;
  columnFormats?: (string | undefined)[];
  columnStyles?: (Partial<ExcelJS.Style> | undefined)[];
  groupFormat?: string;
}

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

  // Run row-level processors
  context.processors.forEach((processor) => {
    const p = processor(processedRowNode, { rowIndex });
    if (isRow(p)) {
      processedRowNode = p;
    }
  });

  const { props } = processedRowNode;
  const initialStyle = mergeDeep(...context.styles, props.style);

  // Phase 1: Flatten the component tree to get a simple array of cells with inherited styles.
  const allCells: { node: CellNode; groupFormat?: string }[] = [];
  function flatten(
    children: AnyNode | AnyNode[] | undefined,
    inheritedStyle: any,
    inheritedFormat?: string,
  ) {
    if (!children) return;
    const childrenArray = Array.isArray(children) ? children : [children];
    childrenArray.forEach((child) => {
      if (!child || !('type' in child)) return;
      if (isGroup(child)) {
        const groupStyle = mergeDeep(inheritedStyle, child.props.style);
        const groupFormat = child.props.format || inheritedFormat;
        flatten(child.props.children, groupStyle, groupFormat);
      } else if (isCell(child)) {
        const finalCellStyle = mergeDeep(inheritedStyle, child.props.style);
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
    // Don't add a row if there are no cells to render.
    return;
  }

  // Clean up expired rowSpans from previous rows
  if (rowSpanState && rowIndex !== undefined) {
    for (const col in rowSpanState) {
      if (rowSpanState[col] < rowIndex) {
        delete rowSpanState[col];
      }
    }
  }

  // Phase 2: Place the flattened cells onto the grid, respecting rowSpans.
  const placedCells: { node: CellNode; col: number; groupFormat?: string }[] = [];
  let columnIndex = 1;
  for (const { node, groupFormat } of allCells) {
    while (rowSpanState?.[columnIndex]) {
      columnIndex++;
    }

    // Run cell-level processors for the current cell
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

  // Phase 3: Create the row in exceljs
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

  // Phase 4: Apply styles and merges for the placed cells
  placedCells.forEach(({ node, col, groupFormat }) => {
    const cell: ExcelJS.Cell = excelRow.getCell(col);
    const colFormat = columnFormats[col - 1];
    const colStyle = columnStyles[col - 1];
    // Set value, formula, and format
    if (node.props.formula) {
      const v = node.props.value;
      cell.value = { formula: node.props.formula };
      if (v !== undefined && isPrimitive(v)) {
        cell.value = Object.assign({}, cell.value, { result: v });
      }
    } else if (node.props.value !== undefined) {
      cell.value = node.props.value;
    }
    // Merge precedence: cell > row > group > column
    const rowStyle = processedRowNode.props.style;
    const mergedStyle = mergeDeep(
      colStyle,
      groupFormat ? {} : {},
      rowStyle,
      node.props.style || {},
    );
    setStyle(cell, mergedStyle);
    // Determine the format from style, row, group, or column (correct precedence)
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
        if (child && child.type === 'Image') {
          // Compute default position if not provided
          const imageNode = { ...child };
          if (!imageNode.props.position) {
            // Estimate width/height from column width and row height
            const colWidth = sheet.getColumn(col).width || 8;
            const rowHeight = excelRow.height || sheet.properties.defaultRowHeight || 15;
            imageNode.props.position = {
              tl: { col, row: excelRow.number },
              ext: {
                width: Math.round(colWidth * 7), // Excel column width approx 7px per unit
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

function populateDefinedNames(
  worksheetNode: WorksheetNode,
  workbook: ExcelJS.Workbook,
  sheet: ExcelJS.Worksheet,
) {
  const children = Array.isArray(worksheetNode.props.children)
    ? worksheetNode.props.children
    : [worksheetNode.props.children];
  const columnNodes: ColumnNode[] = children.filter((c): c is ColumnNode => !!c && isColumn(c));
  const otherNodes: AnyNode[] = children.filter((c): c is AnyNode => !!c && !isColumn(c));

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

  let currentRowNumber = 1;
  let dataBlockStartRow = -1;
  let dataBlockEndRow = -1;

  const findDataRows = (nodes: AnyNode[]) => {
    nodes.forEach((node) => {
      if (isRow(node)) {
        currentRowNumber++;
      } else if (isGroup(node)) {
        const groupChildren = Array.isArray(node.props.children)
          ? node.props.children
          : [node.props.children];
        if (node.props.processor || groupChildren.length > 1) {
          if (dataBlockStartRow === -1) dataBlockStartRow = currentRowNumber;
          const rowCount = groupChildren.filter((c) => !!c && isRow(c)).length;
          dataBlockEndRow = currentRowNumber + rowCount - 1;
        }
        findDataRows(groupChildren.filter((c): c is AnyNode => !!c));
      }
    });
  };
  findDataRows(otherNodes);

  columnNodes.forEach((node, index) => {
    if (node.props.id && dataBlockStartRow !== -1 && dataBlockEndRow !== -1) {
      const colLetter = sheet.getColumn(index + 1).letter;
      const range = `'${sheet.name}'!$${colLetter}$${dataBlockStartRow}:$${colLetter}$${dataBlockEndRow}`;
      workbook.definedNames.add(range, node.props.id);
    }
  });
}

function renderImage(imageNode: ImageNode, context: RenderContext) {
  const { buffer, extension, range, position, hyperlink, tooltip } = imageNode.props;
  const { sheet, workbook } = context;

  if (!sheet || !workbook || !buffer) return;

  // Ensure buffer is a Node.js Buffer
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
    buffer: buf,
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

function render(node: AnyNode | AnyNode[] | undefined, context: RenderContext) {
  if (!node) return;

  const nodes = Array.isArray(node)
    ? node.filter((n): n is AnyNode => !!n)
    : [node].filter((n): n is AnyNode => !!n);

  // Helper for row/group rendering (move out of if block)
  const findAndRenderRows = (
    nodesToSearch: AnyNode | AnyNode[] | undefined,
    currentContext: RenderContext,
    groupFormat?: string,
  ) => {
    if (!nodesToSearch) return;
    const searchArray = Array.isArray(nodesToSearch)
      ? nodesToSearch.filter((n): n is AnyNode => !!n)
      : [nodesToSearch].filter((n): n is AnyNode => !!n);

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
        // Recursively search within groups for rows
        const groupContext: RenderContext = {
          ...currentContext,
          styles: [...currentContext.styles, n.props.style].filter(Boolean) as ExcelJS.Style[],
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
      // Collect column formats and styles
      const children = Array.isArray(child.props.children)
        ? child.props.children.filter((n): n is AnyNode => !!n)
        : [child.props.children].filter((n): n is AnyNode => !!n);
      const columnNodes = children.filter(
        (child): child is ColumnNode => !!child && isColumn(child),
      );
      const columnFormats = columnNodes.map((col: ColumnNode) => col.props.format);
      const columnStyles = columnNodes.map((col: ColumnNode) => col.props.style);
      const sheet = context.workbook.addWorksheet(child.props.name, {
        properties: child.props.properties,
      });
      populateDefinedNames(child, context.workbook, sheet);
      const newSheetContext: RenderContext = {
        ...context,
        sheet,
        rowSpanState: {},
        columnFormats,
        columnStyles,
      };

      // Render images at the worksheet level
      const imageNodes = children.filter((n): n is ImageNode => !!n && isImage(n));
      for (const imageNode of imageNodes) {
        renderImage(imageNode, { ...newSheetContext, sheet });
      }

      // Exclude Image nodes from row/group rendering
      const nonImageChildren = children.filter((n) => !isImage(n));
      findAndRenderRows(nonImageChildren, newSheetContext);
    } else if (isImage(child)) {
    } else {
      throw new Error(`Unknown node type: ${child.type}`);
    }
  }
}

/**
 * Offsets cell references in Excel formulas by a given row offset.
 * This is needed when importing template content to a different position.
 *
 * @param formula - The original Excel formula
 * @param rowOffset - The number of rows to offset (positive = down, negative = up)
 * @returns The formula with updated cell references
 */
function offsetFormulaReferences(formula: string, rowOffset: number): string {
  if (rowOffset === 0) return formula;
  return formula.replace(/([A-Z]+)(\d+)/g, (match, col, row) => {
    const newRow = parseInt(row) + rowOffset;
    if (newRow < 1) {
      console.warn(`[Formula Offset] Row ${newRow} would be invalid, keeping original: ${match}`);
      return match;
    }
    return col + newRow;
  });
}

/**
 * Expands cell references in Excel formulas to ranges by adding a specified number of rows.
 * This is useful for converting single cell references to ranges that span multiple rows.
 *
 * @param formula - The original Excel formula
 * @param rangeRows - The number of additional rows to include in the range (e.g., 6 means E15:E21)
 * @returns The formula with expanded cell references as ranges
 */
function _expandFormulaRanges(formula: string, rangeRows: number): string {
  if (rangeRows <= 0) return formula;

  return formula.replace(/([A-Z]+)(\d+)(?::[A-Z]+\d+)?/g, (match, col, row) => {
    const startRow = parseInt(row);
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

// Helper: Convert ExcelJS worksheet to our node tree
async function worksheetToNodes(ws: ExcelJS.Worksheet, rowOffset: number = 0): Promise<AnyNode[]> {
  const rows: RowNode[] = [];
  // Build a map of merged rectangles: { [topLeftAddress]: { left, top, right, bottom } }
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

  // Instead of ws.eachRow, iterate from 1 to ws.rowCount to preserve empty rows
  for (let rowNumber = 1; rowNumber <= ws.rowCount; rowNumber++) {
    const row = ws.getRow(rowNumber);
    const cells: (CellNode | null)[] = [];
    for (let colNumber = 1; colNumber <= ws.columnCount; colNumber++) {
      const cell = row.getCell(colNumber);
      const address = cell.address;
      // Check if this cell is the top-left of a merge
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
      // Check if this cell is covered by any merge (but not top-left)
      let isCovered = false;
      for (const rect of Object.values(mergeRects)) {
        if (
          rowNumber >= rect.top &&
          rowNumber <= rect.bottom &&
          colNumber >= rect.left &&
          colNumber <= rect.right
        ) {
          // If not the top-left
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
      // Normal cell
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
    // If the row is empty (all cells are null/empty), still add an empty RowNode
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
  // After extracting rows, extract images
  const imageNodes: ImageNode[] = [];
  if (typeof ws.getImages === 'function') {
    const images = ws.getImages();
    for (const img of images) {
      // img.imageId, img.range, etc.
      const workbook = ws.workbook as ExcelJS.Workbook;
      if (typeof workbook.getImage === 'function') {
        const image = workbook.getImage(img.imageId as any);
        if (image?.buffer && image.extension) {
          // Ensure buffer is a Buffer
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

          /*
          @TODO @REMOVE @DEBUG
          const columnWidthToPixels = (width: number) => Math.floor(width * 7.5); // rough
          const rowHeightToPixels = (height: number) => Math.floor(height * 1.33); // rough
          const colPx = columnWidthToPixels(ws.getColumn(1).width ?? 8.43);
          const rowPx = rowHeightToPixels(ws.getRow(rowOffset).height ?? 15);
          console.log("RANGE", img.range);
          */

          imageNodes.push({
            type: 'Image',
            props: {
              buffer: buf,
              extension: image.extension,
              range: img.range as any,
              /*
              position: {
                tl: { col: 0, row: rowOffset },
                ext: {
                  width: Math.round(100 * 7), // Excel column width approx 7px per unit
                  height: Math.round(100),
                },
              }
              */
            },
          });
        }
      }
    }
  }
  // Return both rows and images
  return [...rows, ...imageNodes];
}

interface EvaluationContext {
  currentRow: number;
}

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
    // Load the Excel file and convert to nodes
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(node.props.src);
    const ws = wb.worksheets[0]; // For now, just the first worksheet

    if (node.props.data) {
      // Use expandTemplateRows to generate expanded rows (now returns array directly)
      const expandedRows = expandTemplateRows(
        ws,
        node.props.data,
        '{{',
        '}}',
        node.props.rangeRows || 0,
      );
      ws.spliceRows(context.currentRow - expandedRows.length - 1, 1, ...expandedRows);
    }

    // Pass the current row position to offset formulas correctly
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
 * Evaluates and processes Template nodes by loading Excel files and converting them to node arrays.
 *
 * This function handles the special case of Template nodes by:
 * - Loading the specified Excel file using the src property
 * - Converting the worksheet content to a node tree structure
 * - Returning the converted nodes for further processing
 *
 * For non-Template nodes, it recursively processes children and returns the node unchanged.
 *
 * @param node - The node to evaluate, which may be a Template node or any other node type
 * @returns Promise resolving to the evaluated node tree, or null if node is falsy
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
 * Expand template rows in a worksheet by duplicating the data row for each data object,
 * replacing placeholders, and preparing formula updates.
 *
 * @param ws - The ExcelJS worksheet
 * @param data - The data object: { columns: [{name, aliases}], rows: [objects], ... }
 * @param openPlaceholder - Opening token for placeholders (default: '{{')
 * @param closePlaceholder - Closing token for placeholders (default: '}}')
 * @param rangeRows - The number of additional rows to include in the range
 * @returns expandedRows
 */
function expandTemplateRows(
  ws: ExcelJS.Worksheet,
  data: any,
  _openPlaceholder = '{{',
  _closePlaceholder = '}}',
  _rangeRows: number = 0,
): CellValue[][] {
  const placeholderRegex = /\{\{\s*(.*?)\s*\}\}/;
  const columnsConfig = data.columns || [];
  const template = {
    columns: { matches: 0, rowStartIndex: -1, colStartIndex: -1 },
    rows: { matches: 0, rowStartIndex: -1, colStartIndex: -1 },
  };

  // Identify columns
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

  // Identify data template row
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

  function _replacePlaceholders(cell: ExcelJS.Cell, obj: any) {
    if (typeof cell.value === 'string') {
      const match = cell.value.match(placeholderRegex);
      if (match) {
        cell.value = obj[match[1]];
      }
    }
  }

  // Build the final expanded rows array (as arrays of cell values)
  const expandedRows: CellValue[][] = [];
  for (let rowNumber = 1; rowNumber <= ws.rowCount; rowNumber++) {
    if (rowNumber === template.rows.rowStartIndex) {
      // Insert all expanded data rows here
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
  // Expand formulas in the rows if rangeRows > 0
  return expandedRows;
}
