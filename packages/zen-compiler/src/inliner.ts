/**
 * Computed Inlining Optimizer
 *
 * Detects computed values that are only used once and inlines them.
 *
 * Example:
 * const doubled = computed(() => count.value * 2);
 * const quad = computed(() => doubled.value * 2);
 *
 * Optimized to:
 * const quad = computed(() => count.value * 2 * 2);
 */

import * as t from '@babel/types';

export interface InliningCandidate {
  name: string;
  usageCount: number;
  definition: t.ArrowFunctionExpression | t.FunctionExpression;
  canInline: boolean;
}

/**
 * Analyze computed values for inlining opportunities
 */
export function analyzeInliningCandidates(
  computed: Map<string, any>,
  exportedNames: Set<string> = new Set(),
): Map<string, InliningCandidate> {
  const candidates = new Map<string, InliningCandidate>();

  for (const [name, info] of computed.entries()) {
    // Count how many other computed values depend on this one
    let usageCount = 0;

    for (const other of computed.values()) {
      if (other.deps.has(name)) {
        usageCount++;
      }
    }

    // Can inline if:
    // 1. Used by exactly 1 other computed
    // 2. Has simple function body
    // 3. NOT exported (exported values must remain accessible)
    const canInline = usageCount === 1 && isSimpleFunction(info.fn) && !exportedNames.has(name);

    candidates.set(name, {
      name,
      usageCount,
      definition: info.fn,
      canInline,
    });
  }

  return candidates;
}

/**
 * Check if a function is simple enough to inline
 */
function isSimpleFunction(fn: t.ArrowFunctionExpression | t.FunctionExpression): boolean {
  // For now, accept all functions
  // In the future, could add complexity checks:
  // - No loops
  // - No conditionals
  // - Single expression
  // - etc.

  if (t.isArrowFunctionExpression(fn)) {
    // Arrow function with expression body is simple
    if (t.isExpression(fn.body)) {
      return true;
    }

    // Block statement - check if it's a single return
    if (t.isBlockStatement(fn.body)) {
      if (fn.body.body.length === 1) {
        const stmt = fn.body.body[0];
        return t.isReturnStatement(stmt);
      }
    }
  }

  // Conservative: only inline simple arrow expressions
  return false;
}

/**
 * Generate inlining report
 */
export function generateInliningReport(candidates: Map<string, InliningCandidate>): string {
  const canInline = Array.from(candidates.values()).filter((c) => c.canInline);
  const multiUse = Array.from(candidates.values()).filter((c) => c.usageCount > 1);
  const noUse = Array.from(candidates.values()).filter((c) => c.usageCount === 0);

  let report = '\n[zen-compiler] === Inlining Analysis ===\n';
  report += `Total computed: ${candidates.size}\n`;
  report += `Can inline: ${canInline.length}\n`;
  report += `Multiple uses: ${multiUse.length} (cannot inline)\n`;
  report += `Unused: ${noUse.length} (dead code)\n`;

  if (canInline.length > 0) {
    report += '\nInlining candidates:\n';
    for (const c of canInline) {
      report += `  - ${c.name} (used ${c.usageCount} time)\n`;
    }
  }

  if (noUse.length > 0) {
    report += '\nDead code (unused computed):\n';
    for (const c of noUse) {
      report += `  - ${c.name}\n`;
    }
  }

  report += '======================================\n';

  return report;
}

/**
 * Perform automatic inlining transformation
 *
 * Strategy:
 * 1. Find all references to inlinable computed (e.g., doubled.value)
 * 2. Replace with the inlined expression
 * 3. Remove the original computed declaration
 */
export function performInlining(
  path: any,
  computed: Map<string, any>,
  candidates: Map<string, InliningCandidate>,
): number {
  let inlineCount = 0;

  // Get list of computed to inline
  const toInline = Array.from(candidates.entries())
    .filter(([_, candidate]) => candidate.canInline)
    .map(([name, _]) => name);

  if (toInline.length === 0) return 0;

  // Step 1: Replace all references to inlinable computed
  for (const computedName of toInline) {
    const computedInfo = computed.get(computedName);
    if (!computedInfo) continue;

    const inlinedExpression = getInlinedExpression(computedInfo.fn);
    if (!inlinedExpression) continue;

    // Find all .value accesses for this computed
    path.traverse({
      MemberExpression(memberPath: any) {
        // Check if this is computedName.value
        if (
          t.isIdentifier(memberPath.node.object) &&
          memberPath.node.object.name === computedName &&
          t.isIdentifier(memberPath.node.property) &&
          memberPath.node.property.name === 'value'
        ) {
          // Clone the expression to avoid AST node reuse
          const clonedExpr = t.cloneNode(inlinedExpression, true);
          memberPath.replaceWith(clonedExpr);
          inlineCount++;
        }
      },
    });
  }

  // Step 2: Remove the inlined computed declarations
  path.traverse({
    VariableDeclarator(declPath: any) {
      if (t.isIdentifier(declPath.node.id) && toInline.includes(declPath.node.id.name)) {
        // Remove the entire variable declaration
        const declaration = declPath.parentPath;
        if (t.isVariableDeclaration(declaration.node)) {
          // If this is the only declarator, remove the whole declaration
          if (declaration.node.declarations.length === 1) {
            declaration.remove();
          } else {
            // Otherwise just remove this declarator
            declPath.remove();
          }
        }
      }
    },
  });

  return inlineCount;
}

/**
 * Extract the expression to inline from a computed function
 */
function getInlinedExpression(
  fn: t.ArrowFunctionExpression | t.FunctionExpression,
): t.Expression | null {
  if (t.isArrowFunctionExpression(fn)) {
    // Arrow function with expression body: () => expr
    if (t.isExpression(fn.body)) {
      return fn.body;
    }

    // Arrow function with block statement: () => { return expr; }
    if (t.isBlockStatement(fn.body)) {
      if (fn.body.body.length === 1) {
        const stmt = fn.body.body[0];
        if (t.isReturnStatement(stmt) && stmt.argument) {
          return stmt.argument;
        }
      }
    }
  }

  return null;
}
