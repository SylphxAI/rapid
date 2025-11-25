/** @jsxImportSource @zen/tui */
/**
 * Splitter Component
 *
 * Split terminal into multiple resizable panes (horizontal or vertical).
 * Essential for complex full-screen applications like file managers, IDEs, git UIs.
 *
 * Features:
 * - Horizontal/vertical orientation
 * - Fixed or percentage-based sizes
 * - Minimum size constraints
 * - Keyboard resize support
 * - Nested splitters
 *
 * @example
 * ```tsx
 * <Splitter orientation="horizontal" sizes={[30, 70]}>
 *   <Pane minSize={20}>
 *     <FileTree />
 *   </Pane>
 *   <Pane>
 *     <Editor />
 *   </Pane>
 * </Splitter>
 * ```
 */

import { Box, type Signal, Text, computed, signal, useInput, useTerminalSize } from '@zen/tui';

export interface SplitterProps {
  /** Split direction */
  orientation?: 'horizontal' | 'vertical';

  /** Initial sizes (percentage or fixed) - must sum to 100 if percentages */
  sizes?: number[];

  /** Show divider between panes */
  showDivider?: boolean;

  /** Divider character */
  dividerChar?: string;

  /** Allow keyboard resizing with [ and ] */
  resizable?: boolean;

  /** Focus index for resize */
  focusedPane?: number;

  /** Children must be Pane components */
  children?: any;
}

export interface PaneProps {
  /** Minimum size in cells */
  minSize?: number;

  /** Maximum size in cells */
  maxSize?: number;

  /** Pane content */
  children?: any;
}

/**
 * Pane Component
 *
 * Individual pane within a Splitter. Must be direct child of Splitter.
 */
export function Pane(props: PaneProps) {
  const { children } = props;
  return <Box flexDirection="column">{children}</Box>;
}

/**
 * Splitter Component
 *
 * Splits terminal into multiple resizable panes.
 */
export function Splitter(props: SplitterProps) {
  const {
    orientation = 'horizontal',
    sizes: initialSizes,
    showDivider = true,
    dividerChar,
    resizable = true,
    focusedPane: externalFocusedPane,
    children,
  } = props;

  const terminalSize = useTerminalSize();

  // Extract pane children
  const rawChildren = Array.isArray(children) ? children : children ? [children] : [];
  const panes = rawChildren.filter((child: any) => {
    // Check if this is a Pane component (either function or executed)
    return child?.type === 'box' || typeof child === 'object' || typeof child === 'function';
  });

  const paneCount = panes.length;

  // Initialize sizes
  const internalSizes = signal<number[]>(
    initialSizes || Array(paneCount).fill(Math.floor(100 / paneCount)),
  );

  const internalFocusedPane = signal(externalFocusedPane ?? 0);

  const focusedPane = computed(() =>
    externalFocusedPane !== undefined ? externalFocusedPane : internalFocusedPane.value,
  );

  // Calculate actual pixel sizes based on terminal dimensions
  const actualSizes = computed(() => {
    const totalSize = orientation === 'horizontal' ? terminalSize.columns : terminalSize.rows;

    // Account for dividers
    const dividerCount = showDivider ? paneCount - 1 : 0;
    const availableSize = totalSize - dividerCount;

    const sizes = internalSizes.value;

    // Convert percentages to actual sizes
    const actualSizes: number[] = [];
    let remaining = availableSize;

    for (let i = 0; i < paneCount; i++) {
      const pane = panes[i] as any;
      const minSize = pane?.props?.minSize || 1;
      const maxSize = pane?.props?.maxSize || availableSize;

      // Calculate size
      const isLast = i === paneCount - 1;
      let size: number;

      if (isLast) {
        // Last pane gets remaining space
        size = remaining;
      } else {
        // Calculate from percentage
        size = Math.floor((sizes[i] / 100) * availableSize);
      }

      // Apply constraints
      size = Math.max(minSize, Math.min(maxSize, size));

      actualSizes.push(size);
      remaining -= size;
    }

    return actualSizes;
  });

  // Keyboard resize: [ decreases focused pane, ] increases
  useInput(
    (input) => {
      if (!resizable) return;

      const focused = focusedPane.value;
      const sizes = [...internalSizes.value];

      if (input === '[' && focused > 0) {
        // Decrease focused pane, increase previous
        const delta = 5;
        if (sizes[focused] - delta >= 5) {
          sizes[focused] -= delta;
          sizes[focused - 1] += delta;
          internalSizes.value = sizes;
        }
      } else if (input === ']' && focused < paneCount - 1) {
        // Increase focused pane, decrease next
        const delta = 5;
        if (sizes[focused + 1] - delta >= 5) {
          sizes[focused] += delta;
          sizes[focused + 1] -= delta;
          internalSizes.value = sizes;
        }
      } else if (input === 'Tab') {
        // Cycle focus
        internalFocusedPane.value = (focused + 1) % paneCount;
      }
    },
    { isActive: true },
  );

  // Render horizontal split
  if (orientation === 'horizontal') {
    return (
      <Box flexDirection="row" width="100%">
        {() => {
          const elements: any[] = [];
          panes.forEach((pane: any, index: number) => {
            const width = actualSizes.value[index];
            const isFocused = index === focusedPane.value;

            elements.push(
              <Box
                key={`pane-${index}`}
                width={width}
                flexDirection="column"
                borderStyle={isFocused && resizable ? 'single' : undefined}
                borderColor={isFocused ? 'cyan' : undefined}
              >
                {pane.props.children}
              </Box>,
            );

            if (showDivider && index < paneCount - 1) {
              elements.push(
                <Box key={`divider-${index}`} width={1} flexDirection="column">
                  {() => <Text color="gray">{dividerChar || '│'}</Text>}
                </Box>,
              );
            }
          });
          return elements;
        }}
      </Box>
    );
  }

  // Render vertical split
  return (
    <Box flexDirection="column" height="100%">
      {() => {
        const elements: any[] = [];
        panes.forEach((pane: any, index: number) => {
          const height = actualSizes.value[index];
          const isFocused = index === focusedPane.value;

          elements.push(
            <Box
              key={`pane-${index}`}
              height={height}
              flexDirection="column"
              borderStyle={isFocused && resizable ? 'single' : undefined}
              borderColor={isFocused ? 'cyan' : undefined}
            >
              {pane.props.children}
            </Box>,
          );

          if (showDivider && index < paneCount - 1) {
            elements.push(
              <Box key={`divider-${index}`} height={1}>
                {() => (
                  <Text color="gray">{dividerChar || '─'.repeat(terminalSize.columns)}</Text>
                )}
              </Box>,
            );
          }
        });
        return elements;
      }}
    </Box>
  );
}
