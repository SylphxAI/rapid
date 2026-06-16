/**
 * Mouse Registration
 *
 * Reference-counted enable/disable of terminal mouse reporting. Consumers
 * register interest by id; the terminal mouse modes are enabled on the first
 * consumer and disabled when the last one leaves.
 */

import { ESC } from '../renderer/index.js';

const mouseConsumers = new Set<string>();
let mouseEnabled = false;

function enableTerminalMouse() {
  if (!mouseEnabled) {
    process.stdout.write(ESC.enableMouse);
    process.stdout.write(ESC.enableMouseSGR);
    mouseEnabled = true;
  }
}

function disableTerminalMouse() {
  process.stdout.write(ESC.disableMouseSGR);
  process.stdout.write(ESC.disableMouse);
  mouseEnabled = false;
}

/**
 * Register interest in mouse events.
 */
export function registerMouseInterest(consumerId: string): () => void {
  mouseConsumers.add(consumerId);

  if (mouseConsumers.size === 1) {
    enableTerminalMouse();
  }

  return () => {
    mouseConsumers.delete(consumerId);
    if (mouseConsumers.size === 0) {
      disableTerminalMouse();
    }
  };
}

export function forceDisableMouse() {
  mouseConsumers.clear();
  disableTerminalMouse();
}
