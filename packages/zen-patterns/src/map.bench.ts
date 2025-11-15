import { bench, describe } from 'vitest';
import { listenKeys, map, setKey } from './map';

describe('map primitives', () => {
  bench('create map', () => {
    map({ name: '', email: '', age: 0 });
  });

  bench('read map value', () => {
    const form = map({ name: 'Alice', email: 'test@example.com' });
    form.value;
  });

  bench('setKey single field', () => {
    const form = map({ name: '', email: '', age: 0 });
    let i = 0;
    return () => {
      form.setKey('name', `User${i++}`);
    };
  });

  bench('selectKey access', () => {
    const form = map({ name: 'Alice', email: 'test@example.com' });
    const nameZ = form.selectKey('name');

    return () => {
      nameZ.value;
    };
  });
});

describe('map reactivity', () => {
  bench('listenKeys 1 key', () => {
    const form = map({ name: '', email: '', age: 0 });
    listenKeys(form, ['name'], () => {});

    let i = 0;
    return () => {
      form.setKey('name', `User${i++}`);
    };
  });

  bench('listenKeys 3 keys', () => {
    const form = map({ name: '', email: '', age: 0 });
    listenKeys(form, ['name', 'email', 'age'], () => {});

    let i = 0;
    return () => {
      form.setKey('name', `User${i++}`);
    };
  });

  bench('selective key update (1 of 5)', () => {
    const form = map({ a: 0, b: 0, c: 0, d: 0, e: 0 });
    listenKeys(form, ['a'], () => {});
    listenKeys(form, ['b'], () => {});
    listenKeys(form, ['c'], () => {});
    listenKeys(form, ['d'], () => {});
    listenKeys(form, ['e'], () => {});

    let i = 0;
    return () => {
      form.setKey('a', i++);
    };
  });

  bench('selectKey caching', () => {
    const form = map({ name: 'Alice' });

    return () => {
      const z1 = form.selectKey('name');
      const z2 = form.selectKey('name');
      z1 === z2; // Should be same instance
    };
  });
});

describe('map patterns', () => {
  bench('form validation pattern', () => {
    const form = map({ name: '', email: '', age: 0 });
    const nameZ = form.selectKey('name');
    const emailZ = form.selectKey('email');
    const ageZ = form.selectKey('age');

    let i = 0;
    return () => {
      form.setKey('name', `User${i}`);
      form.setKey('email', `user${i}@example.com`);
      form.setKey('age', 20 + (i % 50));

      const _valid = nameZ.value.length > 0 && emailZ.value.includes('@') && ageZ.value >= 18;

      i++;
    };
  });

  bench('multi-field update', () => {
    const form = map({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
    });

    let i = 0;
    return () => {
      form.setKey('firstName', `First${i}`);
      form.setKey('lastName', `Last${i}`);
      form.setKey('email', `user${i}@example.com`);
      form.setKey('phone', `555-${i % 10000}`);
      form.setKey('address', `${i} Main St`);
      i++;
    };
  });

  bench('read-heavy workload', () => {
    const config = map({
      theme: 'dark',
      fontSize: 14,
      language: 'en',
      notifications: true,
      autoSave: true,
    });

    const theme = config.selectKey('theme');
    const fontSize = config.selectKey('fontSize');
    const language = config.selectKey('language');

    let i = 0;
    return () => {
      if (i % 100 === 0) {
        config.setKey('theme', i % 2 ? 'dark' : 'light');
      }

      // Read multiple times
      theme.value;
      fontSize.value;
      language.value;
      i++;
    };
  });
});

// Map vs alternatives benchmarks removed - cannot import inside bench functions
