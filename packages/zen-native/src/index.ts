/**
 * @zen/native - Native renderer for Zen
 *
 * React Native-style renderer for iOS and Android.
 * Uses @zen/runtime components with native element rendering.
 */

// Re-export runtime for convenience
export {
  signal,
  computed,
  effect,
  batch,
  untrack,
  onMount,
  onCleanup,
} from '@zen/runtime';

// TODO: Native renderer
// export { render } from './render.js';

// TODO: Native components
// export { View } from './components/View.js';
// export { Text } from './components/Text.js';
// export { Image } from './components/Image.js';
// export { Pressable } from './components/Pressable.js';
