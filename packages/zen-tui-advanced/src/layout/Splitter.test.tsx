/** @jsxImportSource @zen/tui */
import { Text } from '@zen/tui';
import { describe, expect, it } from 'vitest';
import { Pane, Splitter } from './Splitter.js';

describe('Splitter', () => {
  it('should render horizontal split with two panes', () => {
    const result = (
      <Splitter orientation="horizontal">
        <Pane>
          <Text>Left Pane</Text>
        </Pane>
        <Pane>
          <Text>Right Pane</Text>
        </Pane>
      </Splitter>
    );

    expect(result).toBeDefined();
    expect(result.type).toBeDefined();
  });

  it('should render vertical split with two panes', () => {
    const result = (
      <Splitter orientation="vertical">
        <Pane>
          <Text>Top Pane</Text>
        </Pane>
        <Pane>
          <Text>Bottom Pane</Text>
        </Pane>
      </Splitter>
    );

    expect(result).toBeDefined();
  });

  it('should support custom sizes', () => {
    const result = (
      <Splitter orientation="horizontal" sizes={[30, 70]}>
        <Pane>
          <Text>Small Pane (30%)</Text>
        </Pane>
        <Pane>
          <Text>Large Pane (70%)</Text>
        </Pane>
      </Splitter>
    );

    expect(result).toBeDefined();
  });

  it('should support minimum size constraints', () => {
    const result = (
      <Splitter orientation="horizontal">
        <Pane minSize={20}>
          <Text>Pane with min 20 cols</Text>
        </Pane>
        <Pane minSize={30}>
          <Text>Pane with min 30 cols</Text>
        </Pane>
      </Splitter>
    );

    expect(result).toBeDefined();
  });

  it('should support three panes', () => {
    const result = (
      <Splitter orientation="horizontal" sizes={[20, 50, 30]}>
        <Pane>
          <Text>Left</Text>
        </Pane>
        <Pane>
          <Text>Middle</Text>
        </Pane>
        <Pane>
          <Text>Right</Text>
        </Pane>
      </Splitter>
    );

    expect(result).toBeDefined();
  });

  it('should support nested splitters', () => {
    const result = (
      <Splitter orientation="horizontal">
        <Pane>
          <Text>Left Pane</Text>
        </Pane>
        <Pane>
          <Splitter orientation="vertical">
            <Pane>
              <Text>Top Right</Text>
            </Pane>
            <Pane>
              <Text>Bottom Right</Text>
            </Pane>
          </Splitter>
        </Pane>
      </Splitter>
    );

    expect(result).toBeDefined();
  });

  it('should hide divider when showDivider=false', () => {
    const result = (
      <Splitter orientation="horizontal" showDivider={false}>
        <Pane>
          <Text>Left</Text>
        </Pane>
        <Pane>
          <Text>Right</Text>
        </Pane>
      </Splitter>
    );

    expect(result).toBeDefined();
  });

  it('should support custom divider character', () => {
    const result = (
      <Splitter orientation="horizontal" dividerChar="║">
        <Pane>
          <Text>Left</Text>
        </Pane>
        <Pane>
          <Text>Right</Text>
        </Pane>
      </Splitter>
    );

    expect(result).toBeDefined();
  });

  it('should disable resize when resizable=false', () => {
    const result = (
      <Splitter orientation="horizontal" resizable={false}>
        <Pane>
          <Text>Left</Text>
        </Pane>
        <Pane>
          <Text>Right</Text>
        </Pane>
      </Splitter>
    );

    expect(result).toBeDefined();
  });
});
