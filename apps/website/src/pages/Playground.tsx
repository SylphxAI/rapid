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
import { For, Show, computed, signal } from '@zen/web';
import * as Zen from '@zen/web';
import { Fragment, jsx } from '@zen/web/jsx-runtime';
import { Icon } from '../components/Icon.tsx';
import { examples } from '../data/examples.ts';

export function Playground() {
  const templates = examples.reduce(
    (acc, ex) => {
      acc[ex.id] = ex.code;
      return acc;
    },
    {} as Record<string, string>,
  );

  const selectedExampleId = signal<string>('counter');
  const code = signal(templates.counter || '');

  const selectedExample = computed(
    () => examples.find((ex) => ex.id === selectedExampleId.value) || examples[0],
  );
  const error = signal('');
  const executeTime = signal(0);

  let editorView: EditorView | null = null;
  let autoRunTimer: number | null = null;

  const loadExample = (exampleId: string) => {
    selectedExampleId.value = exampleId;
    const newCode = templates[exampleId] || templates.counter;
    code.value = newCode;

    if (editorView) {
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: newCode },
      });
    }
  };

  Zen.effect(() => {
    const _currentCode = code.value;

    if (autoRunTimer !== null) {
      clearTimeout(autoRunTimer);
    }

    autoRunTimer = window.setTimeout(() => {
      runCode();
    }, 1000);

    return () => {
      if (autoRunTimer !== null) {
        clearTimeout(autoRunTimer);
      }
    };
  });

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

      const codeWithoutImports = code.value.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');

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

      const createElement = (
        type: unknown,
        props: Record<string, unknown> | null,
        ...children: unknown[]
      ) => {
        const allProps: Record<string, unknown> = props || {};
        if (children.length > 0) {
          allProps.children = children.length === 1 ? children[0] : children;
        }
        // biome-ignore lint/suspicious/noExplicitAny: JSX runtime accepts any component type
        return jsx(type as any, allProps);
      };

      const zenContext = {
        ...Zen,
        ...ZenSignal,
        jsx: createElement,
        Fragment,
        document,
        console,
      };

      const execStart = performance.now();
      const wrappedCode = `
        ${transformed.code}
        return typeof app !== 'undefined' ? app : null;
      `;
      const fn = new Function(...Object.keys(zenContext), wrappedCode);
      const result = fn(...Object.values(zenContext));
      const execEnd = performance.now();

      if (previewEl.firstChild) {
        Zen.disposeNode(previewEl.firstChild);
      }

      previewEl.innerHTML = '';

      if (result && result instanceof Node) {
        previewEl.appendChild(result);
      }

      error.value = '';
      executeTime.value = execEnd - execStart;
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Unknown error';
    }
  };

  return (
    <div class="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top Bar */}
      <div class="h-14 border-b border-white/10 flex items-center justify-between px-4">
        <div class="flex items-center gap-4">
          <a href="/" class="flex items-center gap-2 text-white/90 hover:text-white">
            <Icon icon="lucide:arrow-left" width="18" height="18" />
            <span class="text-sm font-medium">Back</span>
          </a>
          <div class="w-px h-6 bg-white/10" />
          <h1 class="text-sm font-semibold text-white/90">Zen Playground</h1>
        </div>

        <div class="flex items-center gap-3">
          <Show when={() => executeTime.value > 0}>
            <div class="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div class="w-2 h-2 rounded-full bg-emerald-500" />
              <span class="text-xs font-mono text-emerald-400">{executeTime.value.toFixed(2)}ms</span>
            </div>
          </Show>
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => {
              code.value = selectedExample.value.code;
              if (editorView) {
                editorView.dispatch({
                  changes: {
                    from: 0,
                    to: editorView.state.doc.length,
                    insert: selectedExample.value.code,
                  },
                });
              }
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div class="flex h-[calc(100vh-3.5rem)]">
        {/* Sidebar - Example Selector */}
        <div class="w-64 border-r border-white/10 bg-[#0f0f0f] overflow-y-auto">
          <div class="p-3">
            <div class="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2 px-2">
              Examples
            </div>
            <div class="space-y-0.5">
              <For each={examples}>
                {(example) => (
                  <button
                    type="button"
                    class={
                      selectedExampleId.value === example.id
                        ? 'w-full text-left px-3 py-2.5 rounded-lg bg-white/10 text-white'
                        : 'w-full text-left px-3 py-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors'
                    }
                    onClick={() => loadExample(example.id)}
                  >
                    <div class="text-sm font-medium">{example.title}</div>
                    <div class="text-xs text-white/40 mt-0.5 line-clamp-1">{example.description}</div>
                  </button>
                )}
              </For>
            </div>
          </div>
        </div>

        {/* Main Content - Editor & Preview */}
        <div class="flex-1 flex">
          {/* Code Editor */}
          <div class="flex-1 flex flex-col border-r border-white/10">
            <div class="h-10 border-b border-white/10 flex items-center px-4 bg-[#0f0f0f]">
              <span class="text-xs font-medium text-white/50">main.tsx</span>
            </div>
            <div
              class="flex-1 overflow-auto"
              ref={(el) => {
                if (el && !editorView) {
                  initEditor(el as HTMLDivElement);
                }
              }}
            />
          </div>

          {/* Preview */}
          <div class="flex-1 flex flex-col bg-white">
            <div class="h-10 border-b border-gray-200 flex items-center justify-between px-4 bg-gray-50">
              <span class="text-xs font-medium text-gray-500">Preview</span>
              <button
                type="button"
                class="text-xs text-gray-400 hover:text-gray-600"
                onClick={() => {
                  const el = document.getElementById('preview');
                  if (el) el.innerHTML = '';
                }}
              >
                Clear
              </button>
            </div>
            <Show when={() => error.value !== ''}>
              <div class="p-4 bg-red-50 border-b border-red-100">
                <div class="flex items-start gap-2">
                  <Icon icon="lucide:x" width="16" height="16" class="text-red-500 mt-0.5 flex-shrink-0" />
                  <pre class="text-sm text-red-600 font-mono whitespace-pre-wrap">{error}</pre>
                </div>
              </div>
            </Show>
            <div
              id="preview"
              class="flex-1 overflow-auto"
              style="--text: #171717; --bg: #ffffff; --bg-light: #f5f5f5; --bg-lighter: #fafafa; --border: #e5e5e5; --primary: #6366f1; --success: #10b981; --danger: #ef4444;"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
