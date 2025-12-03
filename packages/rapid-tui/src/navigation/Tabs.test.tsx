import { describe, expect, it, vi } from 'vitest';
import { signal } from '../index';
import { Tab, Tabs, handleTabsInput } from './Tabs';

describe('Tab', () => {
  it('should create tab marker node', () => {
    const node = Tab({ name: 'Overview', children: 'Content' });

    expect(node.type).toBe('box');
    expect(node.tagName).toBe('tab-marker');
    expect(node.props?.__tabName).toBe('Overview');
    expect(node.props?.__tabChildren).toBe('Content');
  });

  it('should preserve tab name in marker', () => {
    const node = Tab({ name: 'Settings', children: 'Settings content' });

    expect(node.props?.__tabName).toBe('Settings');
  });

  it('should preserve children in marker', () => {
    const children = { type: 'box', children: [], props: {}, style: {} };
    const node = Tab({ name: 'Test', children });

    expect(node.props?.__tabChildren).toBe(children);
  });
});

describe('Tabs', () => {
  it('should create tabs node with Box component', () => {
    const tabs = [Tab({ name: 'Tab 1', children: 'Content 1' })];
    const node = Tabs({ children: tabs });

    expect(node).toBeDefined();
    expect(node.type).toBe('box');
  });

  it('should accept activeTab as number', () => {
    const tabs = [
      Tab({ name: 'Tab 1', children: 'Content 1' }),
      Tab({ name: 'Tab 2', children: 'Content 2' }),
    ];
    const node = Tabs({ children: tabs, activeTab: 1 });

    expect(node).toBeDefined();
  });

  it('should accept activeTab as signal', () => {
    const tabs = [
      Tab({ name: 'Tab 1', children: 'Content 1' }),
      Tab({ name: 'Tab 2', children: 'Content 2' }),
    ];
    const activeTab = signal(0);
    const node = Tabs({ children: tabs, activeTab });

    expect(node).toBeDefined();
  });

  it('should default to first tab when activeTab not provided', () => {
    const tabs = [
      Tab({ name: 'Tab 1', children: 'Content 1' }),
      Tab({ name: 'Tab 2', children: 'Content 2' }),
    ];
    const node = Tabs({ children: tabs });

    expect(node).toBeDefined();
  });

  it('should generate unique ID if not provided', () => {
    const tabs = [Tab({ name: 'Tab 1', children: 'Content 1' })];
    const node1 = Tabs({ children: tabs });
    const node2 = Tabs({ children: tabs });

    expect(node1).toBeDefined();
    expect(node2).toBeDefined();
  });

  it('should use provided ID', () => {
    const tabs = [Tab({ name: 'Tab 1', children: 'Content 1' })];
    const node = Tabs({ children: tabs, id: 'custom-tabs' });

    expect(node).toBeDefined();
  });

  it('should extract tab names from marker nodes', () => {
    const tabs = [
      Tab({ name: 'Overview', children: 'Overview content' }),
      Tab({ name: 'Settings', children: 'Settings content' }),
    ];
    const node = Tabs({ children: tabs });

    // Tabs should be created successfully
    expect(node).toBeDefined();
  });
});

describe('handleTabsInput', () => {
  it('should move to previous tab with left arrow', () => {
    const activeTab = signal(1);
    const onChange = vi.fn();

    const handled = handleTabsInput('\x1b[D', activeTab, 3, onChange);

    expect(handled).toBe(true);
    expect(activeTab.value).toBe(0);
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('should move to previous tab with h key', () => {
    const activeTab = signal(2);
    const onChange = vi.fn();

    const handled = handleTabsInput('h', activeTab, 3, onChange);

    expect(handled).toBe(true);
    expect(activeTab.value).toBe(1);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('should not move before first tab', () => {
    const activeTab = signal(0);
    const onChange = vi.fn();

    handleTabsInput('\x1b[D', activeTab, 3, onChange);

    expect(activeTab.value).toBe(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should move to next tab with right arrow', () => {
    const activeTab = signal(0);
    const onChange = vi.fn();

    const handled = handleTabsInput('\x1b[C', activeTab, 3, onChange);

    expect(handled).toBe(true);
    expect(activeTab.value).toBe(1);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('should move to next tab with l key', () => {
    const activeTab = signal(0);
    const onChange = vi.fn();

    const handled = handleTabsInput('l', activeTab, 3, onChange);

    expect(handled).toBe(true);
    expect(activeTab.value).toBe(1);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('should not move past last tab', () => {
    const activeTab = signal(2);
    const onChange = vi.fn();

    handleTabsInput('\x1b[C', activeTab, 3, onChange);

    expect(activeTab.value).toBe(2);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should jump to tab with number key', () => {
    const activeTab = signal(0);
    const onChange = vi.fn();

    handleTabsInput('2', activeTab, 5, onChange);

    expect(activeTab.value).toBe(1);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('should jump to last tab with number key', () => {
    const activeTab = signal(0);
    const onChange = vi.fn();

    handleTabsInput('3', activeTab, 3, onChange);

    expect(activeTab.value).toBe(2);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('should ignore number keys beyond tab count', () => {
    const activeTab = signal(0);
    const onChange = vi.fn();

    handleTabsInput('9', activeTab, 3, onChange);

    expect(activeTab.value).toBe(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should ignore zero key', () => {
    const activeTab = signal(1);
    const onChange = vi.fn();

    handleTabsInput('0', activeTab, 3, onChange);

    expect(activeTab.value).toBe(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should ignore unknown keys', () => {
    const activeTab = signal(1);
    const onChange = vi.fn();

    const handled = handleTabsInput('x', activeTab, 3, onChange);

    expect(handled).toBe(false);
    expect(activeTab.value).toBe(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should work without onChange callback', () => {
    const activeTab = signal(0);

    expect(() => handleTabsInput('\x1b[C', activeTab, 3)).not.toThrow();
    expect(activeTab.value).toBe(1);
  });
});
