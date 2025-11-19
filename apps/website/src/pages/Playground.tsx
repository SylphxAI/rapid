import * as Babel from '@babel/standalone';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { bracketMatching, defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import * as ZenSignal from '@zen/signal';
import { effect } from '@zen/signal';
import { Show, signal } from '@zen/zen';
import * as Zen from '@zen/zen';
import { Fragment, jsx } from '@zen/zen/jsx-runtime';
import { examples } from '../data/examples.ts';
import { Icon } from '../components/Icon.tsx';

export function Playground() {
  // Convert examples array to templates object for compatibility
  const templates = examples.reduce((acc, ex) => {
    acc[ex.id] = ex.code;
    return acc;
  }, {} as Record<string, string>);

  const code = signal(templates.finegrained || templates.counter || '');
  const selectedTemplate = signal('finegrained');
  const error = signal('');
  const executeTime = signal(0);
  const renderTime = signal(0);
  const opsPerSecond = signal(0);

  let editorView: EditorView | null = null;
  let autoRunTimer: number | null = null;

  const changeTemplate = (template: string) => {
    selectedTemplate.value = template;
    const newCode = templates[template] || templates.counter;
    code.value = newCode;

    // Update CodeMirror
    if (editorView) {
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: newCode },
      });
    }
  };

  // Auto-run with debounce when code changes
  Zen.effect(() => {
    const _currentCode = code.value;

    // Clear previous timer
    if (autoRunTimer !== null) {
      clearTimeout(autoRunTimer);
    }

    // Debounce auto-run (1 second)
    autoRunTimer = window.setTimeout(() => {
      runCode();
    }, 1000);

    return () => {
      if (autoRunTimer !== null) {
        clearTimeout(autoRunTimer);
      }
    };
  });

  // Initialize CodeMirror
  const initEditor = (container: HTMLDivElement) => {
    const startState = EditorState.create({
      doc: code.value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        syntaxHighlighting(defaultHighlightStyle),
        bracketMatching(),
        closeBrackets(),
        highlightActiveLine(),
        keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap]),
        javascript({ jsx: true, typescript: true }),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            code.value = update.state.doc.toString();
          }
        }),
      ],
    });

    editorView = new EditorView({
      state: startState,
      parent: container,
    });
  };

  const runCode = () => {
    const startTime = performance.now();
    try {
      const previewEl = document.getElementById('preview');
      if (!previewEl) return;

      // Remove import statements (Zen API is provided via context)
      const codeWithoutImports = code.value.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');

      // Transpile JSX to JavaScript using classic runtime
      const transformed = Babel.transform(codeWithoutImports, {
        presets: [
          [
            'react',
            {
              runtime: 'classic',
              pragma: 'jsx',
              pragmaFrag: 'Fragment',
            },
          ],
        ],
        filename: 'playground.tsx',
      });

      // Create React-style createElement wrapper for Zen's jsx
      // Babel classic runtime calls: jsx(type, props, ...children)
      // But Zen expects: jsx(type, { children: [...], ...props })
      const createElement = (type: any, props: any, ...children: any[]) => {
        const allProps = props || {};
        if (children.length > 0) {
          allProps.children = children.length === 1 ? children[0] : children;
        }
        return jsx(type, allProps);
      };

      // Create execution context with Zen API
      const zenContext = {
        ...Zen,
        ...ZenSignal,
        jsx: createElement, // Use adapted createElement
        Fragment,
        document,
        console,
      };

      // Execute transpiled code and capture `app` variable
      const execStart = performance.now();
      const wrappedCode = `
        ${transformed.code}
        return typeof app !== 'undefined' ? app : null;
      `;
      const fn = new Function(...Object.keys(zenContext), wrappedCode);
      const result = fn(...Object.values(zenContext));
      const execEnd = performance.now();

      // Dispose previous render's owner to trigger cleanups
      if (previewEl.firstChild) {
        Zen.disposeNode(previewEl.firstChild);
      }

      // Clear preview only on success
      previewEl.innerHTML = '';

      // Auto-render the app to preview
      if (result && result instanceof Node) {
        previewEl.appendChild(result);
      }

      // Clear error on success
      error.value = '';

      executeTime.value = execEnd - execStart;
      renderTime.value = execEnd - startTime;

      // Calculate rough ops/sec (simple benchmark)
      const iterations = 1000;
      const benchStart = performance.now();
      const testSignal = signal(0);
      for (let i = 0; i < iterations; i++) {
        testSignal.value = i;
      }
      const benchEnd = performance.now();
      const timePerOp = (benchEnd - benchStart) / iterations;
      opsPerSecond.value = Math.round(1000 / timePerOp);
    } catch (e: unknown) {
      // Set error but DON'T clear preview - keep previous working version
      error.value = (e as Error).message || 'Unknown error';
    }
  };

  return (
    <div class="min-h-screen bg-bg py-8">
      <div class="max-w-screen-2xl mx-auto px-6">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-4xl font-bold text-text mb-2">Interactive Playground</h1>
            <p class="text-text-muted">Edit code and see instant results</p>
          </div>
          <div class="flex items-center gap-4">
            {/* Performance Metrics */}
            <Show when={executeTime.value > 0}>
              <div class="flex gap-4 px-4 py-2 bg-bg-light border border-border rounded-zen">
                <div class="text-center">
                  <div class="text-sm text-text-muted">Execute</div>
                  <div class="text-lg font-bold text-success">{executeTime.value.toFixed(2)}ms</div>
                </div>
                <div class="text-center">
                  <div class="text-sm text-text-muted">Total</div>
                  <div class="text-lg font-bold text-primary">{renderTime.value.toFixed(2)}ms</div>
                </div>
                <div class="text-center">
                  <div class="text-sm text-text-muted">Ops/sec</div>
                  <div class="text-lg font-bold text-secondary">
                    {opsPerSecond.value.toLocaleString()}
                  </div>
                </div>
              </div>
            </Show>
          </div>
        </div>

        <Show when={error.value !== ''}>
          <div class="my-4 p-4 bg-red-900/20 border border-red-500/50 rounded-zen text-red-400 font-mono whitespace-pre-wrap">
            <strong>Error:</strong> {error}
          </div>
        </Show>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div class="flex flex-col">
            <div class="flex items-center justify-between bg-bg-lighter border border-border rounded-t-zen px-4 py-2">
              <span class="text-text font-medium">Code Editor</span>
              <select
                class="px-3 py-1 bg-bg border border-border rounded text-text text-sm focus:outline-none focus:border-primary"
                value={selectedTemplate}
                onChange={(e) => changeTemplate((e.target as HTMLSelectElement).value)}
              >
                <option value="finegrained">⚡ Fine-grained</option>
                <option value="counter">Counter</option>
                <option value="todo">Todo App</option>
                <option value="form">Form</option>
                <option value="async">Async Data</option>
              </select>
            </div>
            <div
              class="flex-1 min-h-[500px] border border-t-0 border-border rounded-b-zen overflow-hidden"
              ref={(el) => {
                if (el && !editorView) {
                  initEditor(el as HTMLDivElement);
                }
              }}
            />
          </div>

          <div class="flex flex-col">
            <div class="flex items-center justify-between bg-bg-lighter border border-border rounded-t-zen px-4 py-2">
              <span class="text-text font-medium">Preview</span>
              <button
                type="button"
                class="px-3 py-1 bg-bg hover:bg-border border border-border text-text text-sm rounded transition-colors"
                onClick={() => {
                  document.getElementById('preview').innerHTML = '';
                }}
              >
                Clear
              </button>
            </div>
            <div
              id="preview"
              class="flex-1 min-h-[500px] p-4 bg-bg-lighter border border-t-0 border-border rounded-b-zen overflow-auto"
            />
          </div>
        </div>

        <div class="bg-bg-light border border-border rounded-zen p-6">
          <h3 class="text-xl font-semibold text-text mb-4">💡 Playground Tips</h3>
          <ul class="space-y-2 mb-4 text-text-muted">
            <li class="flex items-start gap-2">
              <span class="text-primary">•</span>
              Create a variable called{' '}
              <code class="px-1 bg-bg border border-border rounded text-primary">app</code> with
              your component
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary">•</span>
              Code runs automatically 1 second after you stop typing
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary">•</span>
              Errors won't clear your preview - previous version stays visible
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary">•</span>
              All Zen features are available: signal, computed, effect, Show, For
            </li>
          </ul>
          <p class="text-sm text-text-muted bg-bg border border-border rounded p-3">
            <strong class="text-text">Note:</strong> Just create your component and assign it to{' '}
            <code class="px-1 bg-bg-lighter border border-border rounded text-primary">
              const app = (...)
            </code>{' '}
            - the playground handles rendering automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
