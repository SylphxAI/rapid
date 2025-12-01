import { For, computed, signal } from '@zen/web';
import { Icon } from '../components/Icon.tsx';
import { categories, examples } from '../data/examples.ts';

export function Examples() {
  const selectedCategory = signal<string>('all');

  const filteredExamples = computed(() => {
    if (selectedCategory.value === 'all') {
      return examples;
    }
    return examples.filter((ex) => ex.category === selectedCategory.value);
  });

  return (
    <div class="min-h-screen bg-bg">
      {/* Hero */}
      <section class="py-16 px-6 bg-gradient-hero border-b border-border">
        <div class="max-w-4xl mx-auto text-center">
          <span class="badge badge-primary mb-4">Learn by Example</span>
          <h1 class="heading-1 text-text mb-4">Examples</h1>
          <p class="text-xl text-text-muted max-w-2xl mx-auto">
            Learn Zen through practical examples. Each example demonstrates core concepts with
            working code you can run in the playground.
          </p>
        </div>
      </section>

      <div class="max-w-6xl mx-auto px-6 py-12">
        {/* Category filter */}
        <div class="flex flex-wrap gap-2 justify-center mb-12">
          <button
            type="button"
            class={selectedCategory.value === 'all' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => {
              selectedCategory.value = 'all';
            }}
          >
            All Examples
          </button>
          <For each={[...categories]}>
            {(cat) => (
              <button
                type="button"
                class={selectedCategory.value === cat.id ? 'btn btn-primary' : 'btn btn-secondary'}
                onClick={() => {
                  selectedCategory.value = cat.id;
                }}
              >
                <Icon icon={cat.icon} width="18" height="18" />
                {cat.name}
              </button>
            )}
          </For>
        </div>

        {/* Examples grid */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <For each={filteredExamples}>
            {(example) => (
              <div class="card card-hover group">
                {/* Header */}
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                    <Icon icon={example.icon} width="20" height="20" />
                  </div>
                  <div>
                    <h3 class="font-semibold text-text">{example.title}</h3>
                    <span class="text-xs text-text-subtle capitalize">{example.category}</span>
                  </div>
                </div>

                {/* Description */}
                <p class="text-text-muted text-sm mb-4 line-clamp-2">{example.description}</p>

                {/* Code preview */}
                <pre class="code-block text-xs mb-4 max-h-24 overflow-hidden">
                  {example.code.slice(0, 150)}...
                </pre>

                {/* Action */}
                <a href={`/playground?example=${example.id}`} class="btn btn-primary w-full">
                  <Icon icon="lucide:play" width="16" height="16" />
                  Run in Playground
                </a>
              </div>
            )}
          </For>
        </div>

        {/* Empty state */}
        {filteredExamples.value.length === 0 && (
          <div class="text-center py-16">
            <div class="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-bg-lighter rounded-full">
              <Icon icon="lucide:search" width="32" height="32" class="text-text-muted" />
            </div>
            <h3 class="heading-3 text-text mb-2">No examples found</h3>
            <p class="text-text-muted">Try selecting a different category</p>
          </div>
        )}

        {/* CTA */}
        <div class="mt-16 card text-center">
          <h3 class="heading-3 text-text mb-3">Ready to try these examples?</h3>
          <p class="text-text-muted mb-6 max-w-xl mx-auto">
            Head to the playground to edit and run any example. See instant results as you modify
            the code.
          </p>
          <a href="/playground" class="btn btn-primary text-lg px-8 py-4">
            <Icon icon="lucide:terminal" width="20" height="20" />
            Open Playground
          </a>
        </div>
      </div>
    </div>
  );
}
