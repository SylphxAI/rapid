import { map, listenKeys } from './dist/index.js';

const form = map({ name: 'Original', email: 'test@example.com' });

const calls = [];
const listener = (value, key, obj) => {
  console.log('Listener called:', { value, key, obj });
  calls.push({ value, key, obj });
};

console.log('Setting up listener...');
const unsub = listenKeys(form, ['name'], listener);

console.log('\nCalls after subscription:', calls.length);
console.log('Calls:', calls);

console.log('\nSetting name to Updated...');
form.setKey('name', 'Updated');

console.log('\nCalls after setKey:', calls.length);
console.log('Calls:', calls);
