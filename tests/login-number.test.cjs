const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = vm.createContext({});
vm.runInContext(fs.readFileSync('google-apps-script/student-app/Server.gs', 'utf8'), context);
const sheet = rows => ({ getDataRange: () => ({ getValues: () => rows.map(row => row.slice()) }) });

test('editable login number resolves to permanent student ID', () => {
  const accounts = sheet([
    ['Student ID', 'Name', '', '', '', '', '', '', 'Login number'],
    ['01', 'An', '', '', '', '', '', '', 4921],
    ['02', 'Bee', '', '', '', '', '', '', 2],
  ]);
  const account = context.findAccountByLoginNumber_(accounts, '004921');
  assert.equal(account.id, '01');
  assert.equal(account.row, 2);
  assert.throws(() => context.findAccountByLoginNumber_(accounts, '1'), /not found/);
  assert.equal(context.findAccountByLoginNumber_(accounts, '2').id, '02');
});

test('old sheets retain default numbers and duplicate numbers are rejected', () => {
  const accounts = sheet([
    ['Student ID', 'Name'], ['01', 'An'], ['02', 'Bee'],
  ]);
  assert.equal(context.findAccountByLoginNumber_(accounts, '01').id, '01');
  accounts.getDataRange = () => ({ getValues: () => [
    ['Student ID', 'Name', '', '', '', '', '', '', 'Login number'],
    ['01', 'An', '', '', '', '', '', '', 2],
    ['02', 'Bee'],
  ] });
  assert.throws(() => context.findAccountByLoginNumber_(accounts, '2'), /assigned twice/);
  assert.throws(() => context.findAccountByLoginNumber_(accounts, '0'), /1–6 digits/);
});
