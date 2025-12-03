/**
 * Mouse Event Parser Tests
 *
 * Tests for SGR extended mouse tracking sequence parsing.
 */
import { describe, expect, it } from 'bun:test';
import { parseMouseEvent, type MouseEvent } from './mouse-parser.js';

describe('parseMouseEvent', () => {
  // ==========================================================================
  // Basic Mouse Events
  // ==========================================================================

  describe('Basic Mouse Events', () => {
    it('should parse left mouse button down', () => {
      const result = parseMouseEvent('\x1b[<0;10;20M');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('mousedown');
      expect(result?.button).toBe('left');
      expect(result?.x).toBe(10);
      expect(result?.y).toBe(20);
    });

    it('should parse left mouse button up', () => {
      const result = parseMouseEvent('\x1b[<0;10;20m');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('mouseup');
      expect(result?.button).toBe('left');
    });

    it('should parse middle mouse button down', () => {
      const result = parseMouseEvent('\x1b[<1;15;25M');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('mousedown');
      expect(result?.button).toBe('middle');
    });

    it('should parse middle mouse button up', () => {
      const result = parseMouseEvent('\x1b[<1;15;25m');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('mouseup');
      expect(result?.button).toBe('middle');
    });

    it('should parse right mouse button down', () => {
      const result = parseMouseEvent('\x1b[<2;30;40M');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('mousedown');
      expect(result?.button).toBe('right');
    });

    it('should parse right mouse button up', () => {
      const result = parseMouseEvent('\x1b[<2;30;40m');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('mouseup');
      expect(result?.button).toBe('right');
    });
  });

  // ==========================================================================
  // Scroll Events
  // ==========================================================================

  describe('Scroll Events', () => {
    it('should parse scroll up', () => {
      const result = parseMouseEvent('\x1b[<64;10;20M');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('scroll');
      expect(result?.button).toBe('scroll-up');
      expect(result?.x).toBe(10);
      expect(result?.y).toBe(20);
    });

    it('should parse scroll down', () => {
      const result = parseMouseEvent('\x1b[<65;10;20M');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('scroll');
      expect(result?.button).toBe('scroll-down');
    });
  });

  // ==========================================================================
  // Mouse Move Events
  // ==========================================================================

  describe('Mouse Move Events', () => {
    it('should parse mouse move with left button', () => {
      const result = parseMouseEvent('\x1b[<32;10;20M');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('mousemove');
      expect(result?.button).toBe('left');
    });

    it('should parse mouse move with middle button', () => {
      const result = parseMouseEvent('\x1b[<33;10;20M');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('mousemove');
      expect(result?.button).toBe('middle');
    });

    it('should parse mouse move with right button', () => {
      const result = parseMouseEvent('\x1b[<34;10;20M');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('mousemove');
      expect(result?.button).toBe('right');
    });

    it('should parse mouse move with no button', () => {
      const result = parseMouseEvent('\x1b[<35;10;20M');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('mousemove');
      expect(result?.button).toBe('none');
    });
  });

  // ==========================================================================
  // Modifier Keys
  // ==========================================================================

  describe('Modifier Keys', () => {
    it('should parse ctrl modifier', () => {
      // Ctrl = bit 16, so 0 + 16 = 16
      const result = parseMouseEvent('\x1b[<16;10;20M');
      expect(result).not.toBeNull();
      expect(result?.ctrl).toBe(true);
      expect(result?.shift).toBeUndefined();
      expect(result?.meta).toBeUndefined();
    });

    it('should parse shift modifier', () => {
      // Shift = bit 4, so 0 + 4 = 4
      const result = parseMouseEvent('\x1b[<4;10;20M');
      expect(result).not.toBeNull();
      expect(result?.shift).toBe(true);
    });

    it('should parse meta modifier', () => {
      // Meta = bit 8, so 0 + 8 = 8
      const result = parseMouseEvent('\x1b[<8;10;20M');
      expect(result).not.toBeNull();
      expect(result?.meta).toBe(true);
    });

    it('should parse multiple modifiers', () => {
      // Ctrl + Shift + Meta = 16 + 4 + 8 = 28
      const result = parseMouseEvent('\x1b[<28;10;20M');
      expect(result).not.toBeNull();
      expect(result?.ctrl).toBe(true);
      expect(result?.shift).toBe(true);
      expect(result?.meta).toBe(true);
    });

    it('should parse ctrl+click', () => {
      // Left button + Ctrl = 0 + 16 = 16
      const result = parseMouseEvent('\x1b[<16;5;10M');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('mousedown');
      expect(result?.button).toBe('left');
      expect(result?.ctrl).toBe(true);
    });
  });

  // ==========================================================================
  // Position
  // ==========================================================================

  describe('Position', () => {
    it('should parse position correctly', () => {
      const result = parseMouseEvent('\x1b[<0;50;100M');
      expect(result?.x).toBe(50);
      expect(result?.y).toBe(100);
    });

    it('should parse position at origin', () => {
      const result = parseMouseEvent('\x1b[<0;1;1M');
      expect(result?.x).toBe(1);
      expect(result?.y).toBe(1);
    });

    it('should parse large positions', () => {
      const result = parseMouseEvent('\x1b[<0;999;888M');
      expect(result?.x).toBe(999);
      expect(result?.y).toBe(888);
    });
  });

  // ==========================================================================
  // Button Release
  // ==========================================================================

  describe('Button Release', () => {
    it('should parse button release (code 3)', () => {
      const result = parseMouseEvent('\x1b[<3;10;20m');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('mouseup');
      expect(result?.button).toBe('none');
    });
  });

  // ==========================================================================
  // Invalid Input
  // ==========================================================================

  describe('Invalid Input', () => {
    it('should return null for non-mouse data', () => {
      expect(parseMouseEvent('hello')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseMouseEvent('')).toBeNull();
    });

    it('should return null for partial sequence', () => {
      expect(parseMouseEvent('\x1b[<')).toBeNull();
    });

    it('should return null for malformed sequence', () => {
      expect(parseMouseEvent('\x1b[<0;10M')).toBeNull(); // Missing y
    });

    it('should return null for non-SGR sequence', () => {
      expect(parseMouseEvent('\x1b[M abc')).toBeNull();
    });

    it('should return null for regular escape sequences', () => {
      expect(parseMouseEvent('\x1b[A')).toBeNull(); // Arrow key
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle single digit coordinates', () => {
      const result = parseMouseEvent('\x1b[<0;1;1M');
      expect(result).not.toBeNull();
      expect(result?.x).toBe(1);
      expect(result?.y).toBe(1);
    });

    it('should handle multi-digit button codes', () => {
      const result = parseMouseEvent('\x1b[<64;10;20M');
      expect(result?.type).toBe('scroll');
    });

    it('should distinguish M (press) from m (release)', () => {
      const press = parseMouseEvent('\x1b[<0;10;20M');
      const release = parseMouseEvent('\x1b[<0;10;20m');

      expect(press?.type).toBe('mousedown');
      expect(release?.type).toBe('mouseup');
    });
  });
});
