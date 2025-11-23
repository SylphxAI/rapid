/**
 * Table component for TUI
 *
 * Display tabular data with headers, borders, and formatting.
 * Matches Ink's ink-table behavior.
 */

import type { TUINode } from '../types';
import { Box } from './Box';
import { Text } from './Text';

export interface TableColumn<T = any> {
  header: string;
  key: keyof T;
  width?: number; // Fixed width, or auto-size if not provided
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  border?: boolean; // Show borders (default: true)
  borderStyle?: 'single' | 'double' | 'round' | 'bold';
  headerColor?: string;
  style?: any;
}

export function Table<T = any>(props: TableProps<T>): TUINode {
  const border = props.border !== false; // default true
  const borderStyle = props.borderStyle || 'single';
  const headerColor = props.headerColor || 'cyan';

  // Calculate column widths
  const columnWidths: number[] = props.columns.map((col, _index) => {
    // Use specified width, or auto-calculate
    if (col.width) return col.width;

    // Auto-size: max of header and all data values
    const headerWidth = col.header.length;
    const dataWidths = props.data.map((row) => {
      const value = row[col.key];
      return String(value ?? '').length;
    });

    return Math.max(headerWidth, ...dataWidths, 3); // Min width 3
  });

  // Format cell value with alignment
  const formatCell = (
    value: any,
    width: number,
    align: 'left' | 'center' | 'right' = 'left',
  ): string => {
    const str = String(value ?? '');
    const padded = str.padEnd(width, ' ');

    if (align === 'right') {
      return padded.padStart(width, ' ');
    }
    if (align === 'center') {
      const leftPad = Math.floor((width - str.length) / 2);
      const rightPad = width - str.length - leftPad;
      return ' '.repeat(leftPad) + str + ' '.repeat(rightPad);
    }

    return padded; // left align
  };

  // Header row
  const headerRow = Box({
    style: {
      flexDirection: 'row',
      borderStyle: border ? borderStyle : undefined,
      borderColor: headerColor,
      paddingX: border ? 1 : 0,
    },
    children: props.columns.map((col, index) =>
      Text({
        key: `header-${index}`,
        children: formatCell(col.header, columnWidths[index], col.align),
        color: headerColor,
        bold: true,
        style: { marginRight: index < props.columns.length - 1 ? 2 : 0 },
      }),
    ),
  });

  // Data rows
  const dataRows = props.data.map((row, rowIndex) =>
    Box({
      key: `row-${rowIndex}`,
      style: {
        flexDirection: 'row',
        borderStyle: border ? borderStyle : undefined,
        paddingX: border ? 1 : 0,
      },
      children: props.columns.map((col, colIndex) => {
        const value = row[col.key];
        return Text({
          key: `cell-${rowIndex}-${colIndex}`,
          children: formatCell(value, columnWidths[colIndex], col.align),
          style: { marginRight: colIndex < props.columns.length - 1 ? 2 : 0 },
        });
      }),
    }),
  );

  // Combine header + rows
  return Box({
    style: {
      flexDirection: 'column',
      ...props.style,
    },
    children: [headerRow, ...dataRows],
  });
}
