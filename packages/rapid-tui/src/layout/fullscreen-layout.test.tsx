/** @jsxImportSource @rapid/tui */
/**
 * FullscreenLayout Component Tests
 *
 * Tests for fullscreen terminal layout.
 */
import { describe, expect, it } from 'bun:test';
import { Text } from '../primitives/Text.js';
import { FullscreenLayout, isFullscreenActive } from './FullscreenLayout.js';

describe('FullscreenLayout', () => {
  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render fullscreen layout', () => {
      const result = FullscreenLayout({});

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
      expect(result.tagName).toBe('fullscreen-layout');
    });

    it('should render with children', () => {
      const result = FullscreenLayout({
        children: <Text>Content</Text>,
      });

      expect(result.children.length).toBeGreaterThan(0);
    });

    it('should render without children', () => {
      const result = FullscreenLayout({});

      expect(result).toBeDefined();
    });

    it('should render with multiple children', () => {
      const result = FullscreenLayout({
        children: [<Text key="1">First</Text>, <Text key="2">Second</Text>],
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Layout Style
  // ==========================================================================

  describe('Layout Style', () => {
    it('should have column flex direction', () => {
      const result = FullscreenLayout({});

      expect(result.style?.flexDirection).toBe('column');
    });

    it('should have reactive width based on terminal columns', () => {
      const result = FullscreenLayout({});

      // Width is now a reactive function for resize support
      expect(result.style?.width).toBeDefined();
      expect(typeof result.style?.width).toBe('function');
      // When called, should return a number
      const widthFn = result.style?.width as () => number;
      expect(typeof widthFn()).toBe('number');
    });

    it('should have reactive height based on terminal rows', () => {
      const result = FullscreenLayout({});

      // Height is now a reactive function for resize support
      expect(result.style?.height).toBeDefined();
      expect(typeof result.style?.height).toBe('function');
      // When called, should return a number
      const heightFn = result.style?.height as () => number;
      expect(typeof heightFn()).toBe('number');
    });

    it('should use terminal size or fallback', () => {
      const result = FullscreenLayout({});

      // Width/height are reactive functions - call them to get values
      const widthFn = result.style?.width as () => number;
      const heightFn = result.style?.height as () => number;
      // Should use process.stdout.columns/rows or fallback to 80x24
      expect(widthFn()).toBeGreaterThanOrEqual(80);
      expect(heightFn()).toBeGreaterThanOrEqual(24);
    });
  });

  // ==========================================================================
  // Props
  // ==========================================================================

  describe('Props', () => {
    it('should not spread children to props', () => {
      const result = FullscreenLayout({
        children: <Text>Content</Text>,
      });

      // props should be empty object, not contain children
      expect(result.props).toEqual({});
    });
  });

  // ==========================================================================
  // Fullscreen State
  // ==========================================================================

  describe('Fullscreen State', () => {
    it('should export isFullscreenActive function', () => {
      expect(typeof isFullscreenActive).toBe('function');
    });

    it('should return boolean from isFullscreenActive', () => {
      const result = isFullscreenActive();

      expect(typeof result).toBe('boolean');
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle undefined children', () => {
      const result = FullscreenLayout({ children: undefined });

      expect(result).toBeDefined();
    });

    it('should handle null children', () => {
      const result = FullscreenLayout({ children: null });

      expect(result).toBeDefined();
    });

    it('should handle nested FullscreenLayout', () => {
      const result = FullscreenLayout({
        children: FullscreenLayout({ children: <Text>Nested</Text> }),
      });

      expect(result).toBeDefined();
    });

    it('should handle complex nested content', () => {
      const result = FullscreenLayout({
        children: (
          <Text>
            <Text>Deeply</Text>
            <Text>Nested</Text>
            <Text>Content</Text>
          </Text>
        ),
      });

      expect(result).toBeDefined();
    });
  });
});
