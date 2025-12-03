import { describe, expect, it } from 'vitest';
import { Link } from './Link';

describe('Link', () => {
  it('should create link node with Text component', () => {
    const node = Link({
      url: 'https://example.com',
      children: 'Example',
    });

    expect(node).toBeDefined();
    expect(node.type).toBe('text');
  });

  it('should use OSC 8 escape sequences by default', () => {
    const node = Link({
      url: 'https://github.com',
      children: 'GitHub',
    });

    expect(node).toBeDefined();
    expect(node.children).toBeDefined();
    // OSC 8 format: \x1b]8;;URL\x1b\\TEXT\x1b]8;;\x1b\\
    if (typeof node.children === 'string') {
      expect(node.children).toContain('\x1b]8;;https://github.com\x1b\\');
      expect(node.children).toContain('GitHub');
    }
  });

  it('should show URL in fallback mode', () => {
    const node = Link({
      url: 'https://example.com',
      children: 'Example',
      fallback: true,
    });

    expect(node).toBeDefined();
    if (typeof node.children === 'string') {
      expect(node.children).toBe('Example (https://example.com)');
    }
  });

  it('should not show URL when fallback is false', () => {
    const node = Link({
      url: 'https://example.com',
      children: 'Example',
      fallback: false,
    });

    expect(node).toBeDefined();
    if (typeof node.children === 'string') {
      expect(node.children).not.toContain('(https://example.com)');
    }
  });

  it('should apply cyan color by default', () => {
    const node = Link({
      url: 'https://example.com',
      children: 'Example',
    });

    expect(node.props?.color).toBe('cyan');
  });

  it('should apply underline by default', () => {
    const node = Link({
      url: 'https://example.com',
      children: 'Example',
    });

    expect(node.props?.underline).toBe(true);
  });

  it('should accept custom styles', () => {
    const node = Link({
      url: 'https://example.com',
      children: 'Example',
      style: { color: 'blue', bold: true },
    });

    expect(node).toBeDefined();
    expect(node.props?.bold).toBe(true);
  });

  it('should handle long URLs', () => {
    const longUrl = 'https://example.com/very/long/path/to/resource?with=query&params=true';
    const node = Link({
      url: longUrl,
      children: 'Link',
    });

    expect(node).toBeDefined();
  });

  it('should handle different protocols', () => {
    const httpsLink = Link({ url: 'https://example.com', children: 'HTTPS' });
    const httpLink = Link({ url: 'http://example.com', children: 'HTTP' });
    const ftpLink = Link({ url: 'ftp://example.com', children: 'FTP' });

    expect(httpsLink).toBeDefined();
    expect(httpLink).toBeDefined();
    expect(ftpLink).toBeDefined();
  });
});
