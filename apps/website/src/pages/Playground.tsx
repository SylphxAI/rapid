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
import { For, Show, computed, signal } from '@zen/web';
import * as Zen from '@zen/web';
import { Fragment, jsx } from '@zen/web/jsx-runtime';
import { Icon } from '../components/Icon.tsx';
import { categories, examples } from '../data/examples.ts';

export function Playground() {
  const templates = examples.reduce(
    (acc, ex) => {
      acc[ex.id] = ex.code;
      return acc;
    },
    {} as Record<string, string>,
  );

  const selectedCategory = signal<string>('basic');
  const selectedExampleId = signal<string>('counter');
  const code = signal(templates.counter || '');

  const filteredExamples = computed(() =>
    examples.filter((ex) => ex.category === selectedCategory.value),
  );

  const selectedExample = computed(
    () => examples.find((ex) => ex.id === selectedExampleId.value) || examples[0],
  );
  const error = signal('');
  const executeTime = signal(0);
  const renderTime = signal(0);
  const opsPerSecond = signal(0);

  let editorView: EditorView | null = null;
  let autoRunTimer: number | null = null;

  const handleCategoryChange = (categoryId: string) => {
    selectedCategory.value = categoryId;
    const firstExample = examples.find((ex) => ex.category === categoryId);
    if (firstExample) {
      selectedExampleId.value = firstExample.id;
      loadExample(firstExample.id);
    }
  };

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

      // biome-ignore lint/suspicious/noExplicitAny: JSX createElement requires dynamic types
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
      renderTime.value = execEnd - startTime;

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
      error.value = (e as Error).message || 'Unknown error';
    }
  };

  return (
    <div class="min-h-screen bg-bg">
      {/* Hero */}
      <section class="py-8 px-6 bg-gradient-hero border-b border-border">
        <div class="max-w-7xl mx-auto">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 class="heading-2 text-text mb-2">Interactive Playground</h1>
              <p class="text-text-muted">Browse examples, edit code, and see instant results</p>
            </div>
            <Show when={() => executeTime.value > 0}>
              <div class="flex gap-4">
                <div class="text-center px-4 py-2 bg-bg-light border border-border rounded-xl">
                  <div class="text-xs text-text-muted">Execute</div>
                  <div class="font-bold text-success">{executeTime.value.toFixed(2)}ms</div>
                </div>
                <div class="text-center px-4 py-2 bg-bg-light border border-border rounded-xl">
                  <div class="text-xs text-text-muted">Total</div>
                  <div class="font-bold text-primary">{renderTime.value.toFixed(2)}ms</div>
                </div>
                <div class="text-center px-4 py-2 bg-bg-light border border-border rounded-xl">
                  <div class="text-xs text-text-muted">Ops/sec</div>
                  <div class="font-bold text-secondary">{opsPerSecond.value.toLocaleString()}</div>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </section>

      <div class="max-w-7xl mx-auto px-6 py-8">
        <div class="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside class="col-span-12 lg:col-span-3 space-y-4">
            {/* Categories */}
            <div class="card">
              <h3 class="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                Categories
              </h3>
              <nav class="space-y-1">
                <For each={categories}>
                  {(category) => (
                    <button
                      type="button"
                      class={
                        selectedCategory.value === category.id
                          ? 'w-full flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-xl font-medium transition-all'
                          : 'w-full flex items-center gap-2 px-3 py-2 text-text-muted hover:text-text hover:bg-bg-lighter rounded-xl transition-all'
                      }
                      onClick={() => handleCategoryChange(category.id)}
                    >
                      <Icon icon={category.icon} width="18" height="18" />
                      <span class="text-sm">{category.name}</span>
                    </button>
                  )}
                </For>
              </nav>
            </div>

            {/* Examples List */}
            <div class="card">
              <h3 class="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                Examples
              </h3>
              <div class="space-y-2">
                <For each={filteredExamples}>
                  {(example) => (
                    <button
                      type="button"
                      class={
                        selectedExampleId.value === example.id
                          ? 'w-full text-left p-3 bg-primary/10 border-2 border-primary rounded-xl transition-all'
                          : 'w-full text-left p-3 bg-bg-lighter hover:bg-bg-dark border-2 border-transparent rounded-xl transition-all'
                      }
                      onClick={() => loadExample(example.id)}
                    >
                      <div class="flex items-start gap-3">
                        <div
                          class={
                            selectedExampleId.value === example.id
                              ? 'flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-white rounded-lg'
                              : 'flex-shrink-0 w-8 h-8 flex items-center justify-center bg-bg text-primary rounded-lg'
                          }
                        >
                          <Icon icon={example.icon} width="16" height="16" />
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="text-sm font-semibold text-text truncate">{example.title}</h4>
                          <p class="text-xs text-text-muted line-clamp-2">{example.description}</p>
                        </div>
                      </div>
                    </button>
                  )}
                </For>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main class="col-span-12 lg:col-span-9 space-y-4">
            {/* Current Example Header */}
            <div class="card flex items-center gap-4">
              <div class="w-12 h-12 flex items-center justify-center bg-primary text-white rounded-xl">
                <Icon icon={selectedExample.value.icon} width="24" height="24" />
              </div>
              <div class="flex-1">
                <h2 class="text-lg font-semibold text-text">{selectedExample.value.title}</h2>
                <p class="text-sm text-text-muted">{selectedExample.value.description}</p>
              </div>
            </div>

            <Show when={() => error.value !== ''}>
              <div class="p-4 bg-error/10 border border-error/30 rounded-xl text-error font-mono text-sm">
                <strong>Error:</strong> {error}
              </div>
            </Show>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Editor */}
              <div class="card p-0 overflow-hidden">
                <div class="flex items-center justify-between bg-bg-lighter border-b border-border px-4 py-3">
                  <span class="font-medium text-text text-sm">Code Editor</span>
                  <button
                    type="button"
                    class="btn btn-ghost text-sm px-3 py-1"
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
                    <Icon icon="lucide:rotate-ccw" width="14" height="14" />
                    Reset
                  </button>
                </div>
                <div
                  class="min-h-[500px]"
                  ref={(el) => {
                    if (el && !editorView) {
                      initEditor(el as HTMLDivElement);
                    }
                  }}
                />
              </div>

              {/* Preview */}
              <div class="card p-0 overflow-hidden">
                <div class="flex items-center justify-between bg-bg-lighter border-b border-border px-4 py-3">
                  <span class="font-medium text-text text-sm">Live Preview</span>
                  <button
                    type="button"
                    class="btn btn-ghost text-sm px-3 py-1"
                    onClick={() => {
                      const el = document.getElementById('preview');
                      if (el) el.innerHTML = '';
                    }}
                  >
                    <Icon icon="lucide:x" width="14" height="14" />
                    Clear
                  </button>
                </div>
                <div id="preview" class="min-h-[500px] p-4 overflow-auto" />
              </div>
            </div>

            {/* Tips */}
            <div class="card">
              <h3 class="font-semibold text-text mb-4 flex items-center gap-2">
                <Icon icon="lucide:lightbulb" width="18" height="18" class="text-warning" />
                Playground Tips
              </h3>
              <ul class="space-y-2 text-sm text-text-muted">
                <li class="flex items-start gap-2">
                  <span class="text-primary">1.</span>
                  <span>
                    Create a variable called{' '}
                    <code class="px-1.5 py-0.5 bg-bg-lighter border border-border rounded text-primary text-xs">
                      app
                    </code>{' '}
                    with your component
                  </span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-primary">2.</span>
                  <span>Code runs automatically 1 second after you stop typing</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-primary">3.</span>
                  <span>Errors won't clear your preview - previous version stays visible</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-primary">4.</span>
                  <span>All Zen features available: signal, computed, effect, Show, For</span>
                </li>
              </ul>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
