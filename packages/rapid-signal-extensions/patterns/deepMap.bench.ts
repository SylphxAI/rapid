import { bench, describe } from 'bun:test';
import { deepMap, listenPaths, setPath } from './deepMap';

describe('deepMap primitives', () => {
  bench('create deepMap', () => {
    deepMap({ ui: { theme: 'dark', layout: { width: 200 } } });
  });

  bench('setPath shallow', () => {
    const config = deepMap({ ui: { theme: 'dark' } });
    let i = 0;
    return () => {
      config.setPath('ui.theme', i++ % 2 ? 'dark' : 'light');
    };
  });

  bench('setPath nested (2 levels)', () => {
    const config = deepMap({ ui: { layout: { width: 200 } } });
    let i = 0;
    return () => {
      config.setPath('ui.layout.width', 200 + i++);
    };
  });

  bench('setPath nested (3 levels)', () => {
    const config = deepMap({ app: { ui: { theme: { mode: 'dark' } } } });
    let i = 0;
    return () => {
      config.setPath('app.ui.theme.mode', i++ % 2 ? 'dark' : 'light');
    };
  });

  bench('setPath array notation', () => {
    const data = deepMap({ items: [{ name: 'A' }, { name: 'B' }] });
    let i = 0;
    return () => {
      data.setPath('items[0].name', `Item${i++}`);
    };
  });

  bench('setPath array path', () => {
    const data = deepMap({ items: [{ name: 'A' }] });
    let i = 0;
    return () => {
      data.setPath(['items', 0, 'name'], `Item${i++}`);
    };
  });
});

describe('deepMap reactivity', () => {
  bench('listenPaths 1 path', () => {
    const config = deepMap({ ui: { theme: 'dark', color: 'blue' } });
    listenPaths(config, ['ui.theme'], () => {});

    let i = 0;
    return () => {
      config.setPath('ui.theme', i++ % 2 ? 'dark' : 'light');
    };
  });

  bench('listenPaths 3 paths', () => {
    const config = deepMap({ ui: { theme: 'dark', color: 'blue', size: 'medium' } });
    listenPaths(config, ['ui.theme', 'ui.color', 'ui.size'], () => {});

    let i = 0;
    return () => {
      config.setPath('ui.theme', i++ % 2 ? 'dark' : 'light');
    };
  });

  bench('selective path reactivity', () => {
    const config = deepMap({
      ui: { theme: 'dark', layout: { width: 200, height: 400 } },
      api: { url: 'https://api.example.com', timeout: 5000 },
    });

    listenPaths(config, ['ui.theme'], () => {});
    listenPaths(config, ['ui.layout.width'], () => {});
    listenPaths(config, ['api.url'], () => {});

    let i = 0;
    return () => {
      // Only triggers ui.theme listener
      config.setPath('ui.theme', i++ % 2 ? 'dark' : 'light');
    };
  });

  bench('selectPath access', () => {
    const config = deepMap({ ui: { theme: 'dark' } });
    const themeZ = config.selectPath('ui.theme');

    return () => {
      themeZ.value;
    };
  });

  bench('selectPath caching', () => {
    const config = deepMap({ ui: { theme: 'dark' } });

    return () => {
      const z1 = config.selectPath('ui.theme');
      const z2 = config.selectPath('ui.theme');
      z1 === z2; // Should be same instance
    };
  });
});

describe('deepMap patterns', () => {
  bench('config management pattern', () => {
    const config = deepMap({
      ui: { theme: 'dark', fontSize: 14, language: 'en' },
      api: { url: 'https://api.example.com', timeout: 5000 },
      features: { darkMode: true, notifications: true },
    });

    let i = 0;
    return () => {
      config.setPath('ui.theme', i % 2 ? 'dark' : 'light');
      config.setPath('ui.fontSize', 12 + (i % 10));
      config.setPath('features.darkMode', i % 2 === 0);
      i++;
    };
  });

  bench('nested state updates', () => {
    const state = deepMap({
      user: {
        profile: { name: 'Alice', age: 30 },
        settings: { theme: 'dark', notifications: true },
      },
    });

    let i = 0;
    return () => {
      state.setPath('user.profile.name', `User${i}`);
      state.setPath('user.profile.age', 20 + (i % 50));
      state.setPath('user.settings.theme', i % 2 ? 'dark' : 'light');
      i++;
    };
  });

  bench('create missing intermediates', () => {
    const data = deepMap<any>({});

    let i = 0;
    return () => {
      data.setPath('level1.level2.level3', i++);
    };
  });

  bench('array manipulation', () => {
    const data = deepMap({
      items: [
        { id: 0, name: 'Item 0' },
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ],
    });

    let i = 0;
    return () => {
      data.setPath(`items[${i % 3}].name`, `Updated ${i}`);
      i++;
    };
  });

  bench('deep read-heavy workload', () => {
    const config = deepMap({
      app: {
        ui: { theme: 'dark', fontSize: 14 },
        features: { analytics: true, logging: false },
      },
    });

    const theme = config.selectPath('app.ui.theme');
    const fontSize = config.selectPath('app.ui.fontSize');
    const analytics = config.selectPath('app.features.analytics');

    let i = 0;
    return () => {
      if (i % 100 === 0) {
        config.setPath('app.ui.theme', i % 2 ? 'dark' : 'light');
      }

      // Read multiple times
      theme.value;
      fontSize.value;
      analytics.value;
      i++;
    };
  });
});

// DeepMap vs alternatives benchmarks removed - cannot import inside bench functions
