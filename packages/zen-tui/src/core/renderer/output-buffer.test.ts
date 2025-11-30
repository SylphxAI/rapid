import { describe, expect, it, beforeEach } from 'bun:test';
import { OutputBuffer, ESC, createOutputBuffer } from './output-buffer.js';

describe('OutputBuffer', () => {
  let buffer: OutputBuffer;

  beforeEach(() => {
    buffer = new OutputBuffer();
  });

  describe('basic operations', () => {
    it('starts empty', () => {
      expect(buffer.isEmpty).toBe(true);
      expect(buffer.length).toBe(0);
    });

    it('writes content', () => {
      buffer.write('hello');
      expect(buffer.isEmpty).toBe(false);
      expect(buffer.length).toBe(1);
      expect(buffer.getContent()).toBe('hello');
    });

    it('writes multiple contents', () => {
      buffer.write('hello');
      buffer.write(' ');
      buffer.write('world');
      expect(buffer.getContent()).toBe('hello world');
    });

    it('writeAll writes multiple at once', () => {
      buffer.writeAll('a', 'b', 'c');
      expect(buffer.getContent()).toBe('abc');
    });

    it('ignores empty strings', () => {
      buffer.write('');
      buffer.write('hello');
      buffer.write('');
      expect(buffer.length).toBe(1);
    });
  });

  describe('clear', () => {
    it('clears buffer', () => {
      buffer.write('hello');
      buffer.clear();
      expect(buffer.isEmpty).toBe(true);
      expect(buffer.getContent()).toBe('');
    });
  });

  describe('collect', () => {
    it('returns content and clears buffer', () => {
      buffer.write('hello');
      const content = buffer.collect();
      expect(content).toBe('hello');
      expect(buffer.isEmpty).toBe(true);
    });
  });

  describe('synchronized output', () => {
    it('adds sync start sequence', () => {
      buffer.beginSync();
      expect(buffer.getContent()).toBe('\x1b[?2026h');
    });

    it('adds sync end sequence', () => {
      buffer.beginSync();
      buffer.endSync();
      expect(buffer.getContent()).toBe('\x1b[?2026h\x1b[?2026l');
    });

    it('does not duplicate sync start', () => {
      buffer.beginSync();
      buffer.beginSync();
      expect(buffer.getContent()).toBe('\x1b[?2026h');
    });

    it('does not add end without start', () => {
      buffer.endSync();
      expect(buffer.getContent()).toBe('');
    });

    it('can be disabled', () => {
      buffer.setSyncEnabled(false);
      buffer.beginSync();
      buffer.write('content');
      buffer.endSync();
      expect(buffer.getContent()).toBe('content');
    });
  });

  describe('cursor movement', () => {
    it('moveTo generates correct sequence', () => {
      buffer.moveTo(5, 10);
      expect(buffer.getContent()).toBe('\x1b[5;10H');
    });

    it('moveTo defaults to column 1', () => {
      buffer.moveTo(5);
      expect(buffer.getContent()).toBe('\x1b[5;1H');
    });

    it('moveUp generates correct sequence', () => {
      buffer.moveUp(3);
      expect(buffer.getContent()).toBe('\x1b[3A');
    });

    it('moveUp with 0 does nothing', () => {
      buffer.moveUp(0);
      expect(buffer.isEmpty).toBe(true);
    });

    it('moveDown generates correct sequence', () => {
      buffer.moveDown(3);
      expect(buffer.getContent()).toBe('\x1b[3B');
    });

    it('carriageReturn generates correct sequence', () => {
      buffer.carriageReturn();
      expect(buffer.getContent()).toBe('\r');
    });
  });

  describe('clearing', () => {
    it('clearLine generates correct sequence', () => {
      buffer.clearLine();
      expect(buffer.getContent()).toBe('\x1b[2K');
    });

    it('clearToEOL generates correct sequence', () => {
      buffer.clearToEOL();
      expect(buffer.getContent()).toBe('\x1b[K');
    });

    it('clearToEOS generates correct sequence', () => {
      buffer.clearToEOS();
      expect(buffer.getContent()).toBe('\x1b[J');
    });

    it('clearScreen generates correct sequence', () => {
      buffer.clearScreen();
      expect(buffer.getContent()).toBe('\x1b[2J');
    });
  });

  describe('compound operations', () => {
    it('updateLine moves, clears, and writes', () => {
      buffer.updateLine(5, 'hello');
      expect(buffer.getContent()).toBe('\x1b[5;1H\x1b[2Khello');
    });

    it('replaceLine returns, clears, and writes', () => {
      buffer.replaceLine('hello');
      expect(buffer.getContent()).toBe('\r\x1b[2Khello');
    });
  });
});

describe('ESC constants', () => {
  it('has correct cursor movement sequences', () => {
    expect(ESC.cursorTo(1, 1)).toBe('\x1b[1;1H');
    expect(ESC.cursorUp(5)).toBe('\x1b[5A');
    expect(ESC.cursorDown(5)).toBe('\x1b[5B');
    expect(ESC.cursorForward(5)).toBe('\x1b[5C');
    expect(ESC.cursorBack(5)).toBe('\x1b[5D');
    expect(ESC.cursorHome).toBe('\x1b[H');
    expect(ESC.cursorReturn).toBe('\r');
  });

  it('returns empty string for zero movement', () => {
    expect(ESC.cursorUp(0)).toBe('');
    expect(ESC.cursorDown(0)).toBe('');
    expect(ESC.cursorForward(0)).toBe('');
    expect(ESC.cursorBack(0)).toBe('');
  });

  it('has correct erase sequences', () => {
    expect(ESC.clearLine).toBe('\x1b[2K');
    expect(ESC.clearToEndOfLine).toBe('\x1b[K');
    expect(ESC.clearScreen).toBe('\x1b[2J');
    expect(ESC.clearToEndOfScreen).toBe('\x1b[J');
  });

  it('has correct cursor visibility sequences', () => {
    expect(ESC.hideCursor).toBe('\x1b[?25l');
    expect(ESC.showCursor).toBe('\x1b[?25h');
  });

  it('has correct alternate screen sequences', () => {
    expect(ESC.enterAltScreen).toBe('\x1b[?1049h');
    expect(ESC.exitAltScreen).toBe('\x1b[?1049l');
  });

  it('has correct mouse sequences', () => {
    expect(ESC.enableMouse).toBe('\x1b[?1000h');
    expect(ESC.disableMouse).toBe('\x1b[?1000l');
    expect(ESC.enableMouseSGR).toBe('\x1b[?1006h');
    expect(ESC.disableMouseSGR).toBe('\x1b[?1006l');
  });

  it('has correct sync sequences', () => {
    expect(ESC.syncStart).toBe('\x1b[?2026h');
    expect(ESC.syncEnd).toBe('\x1b[?2026l');
  });
});

describe('createOutputBuffer', () => {
  it('creates buffer with default settings', () => {
    const buffer = createOutputBuffer();
    expect(buffer.isSyncEnabled()).toBe(true);
  });

  it('creates buffer with custom sync setting', () => {
    const buffer = createOutputBuffer({ syncEnabled: false });
    expect(buffer.isSyncEnabled()).toBe(false);
  });
});
