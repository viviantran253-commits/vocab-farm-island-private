const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'apps-script-student');
const properties = {};
const opened = [];
const server = vm.createContext({
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => properties[key] || '' }) },
  SpreadsheetApp: { openById: id => { opened.push(id); return { id }; } },
});
vm.runInContext(fs.readFileSync(path.join(root, 'Server.gs'), 'utf8'), server);

const browser = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(root, 'RecoveryCode.html'), 'utf8'), browser);

const plots = Array.from({ length: 10 }, (_, i) => ({
  unlocked: i < 3,
  crop: i === 1 ? { type: 'carrot', stage: 2, nextDueAt: 123456789 } : null,
}));
const legacy = {
  version: 2, id: '01', name: 'Original name', gold: 817, level: 6, xp: 41, xpTotal: 932,
  seeds: { carrot: 4, retiredSeed: 2 }, harvest: { carrot: 9 }, plots,
  orders: [{ id: 'old-order' }], ordersExpire: 1234, lastWords: ['word-1'],
  history: [{ wordId: 'word-1', correct: true }], sales: [{ crop: 'carrot' }],
  badges: ['first-harvest'], daily: { day: '2026-11-20', correct: 3 },
  weekly: { week: '2026-W47', correct: 8 }, position: { x: 500, y: 600 },
  settings: { fastDemo: false }, ownedRetiredItem: 'old-decoration-id',
};

test('server migration adds fields while preserving a legacy save', () => {
  const before = JSON.stringify(legacy);
  const migrated = server.normalizeOnlineProfile_(legacy, '01', 'Current teacher name');
  assert.equal(JSON.stringify(legacy), before, 'migration must not mutate the saved source');
  for (const key of ['gold', 'level', 'xp', 'xpTotal', 'seeds', 'harvest', 'plots', 'orders',
    'ordersExpire', 'lastWords', 'history', 'sales', 'badges', 'daily', 'weekly', 'position',
    'ownedRetiredItem']) {
    assert.equal(JSON.stringify(migrated[key]), JSON.stringify(legacy[key]), key);
  }
  assert.equal(migrated.name, 'Current teacher name');
  assert.equal(migrated.saveSchemaVersion, 1);
  for (const key of ['companions', 'discovered', 'fences', 'decorations']) {
    assert.equal(JSON.stringify(migrated[key]), '[]', key);
  }
  assert.equal(JSON.stringify(migrated.decorStock), '{}');
  assert.equal(migrated.specialSeedLastPurchase, '');
});

test('browser migration preserves the same classroom progress', () => {
  const defaults = server.freshProfile_('01', 'Current teacher name');
  const migrated = browser.window.VFIRecovery.migrateProfile(legacy, defaults, '01');
  assert.equal(migrated.gold, 817);
  assert.equal(migrated.xpTotal, 932);
  assert.equal(migrated.seeds.retiredSeed, 2);
  assert.equal(migrated.plots[1].crop.nextDueAt, 123456789);
  assert.equal(migrated.ownedRetiredItem, 'old-decoration-id');
  assert.equal(JSON.stringify(migrated.companions), '[]');
});

test('migrations refuse mismatched IDs and unsupported future schemas', () => {
  assert.throws(() => server.normalizeOnlineProfile_(legacy, '02', 'Other'), /ID mismatch/);
  assert.throws(() => browser.window.VFIRecovery.migrateProfile(legacy, {}, '02'), /ID mismatch/);
  assert.throws(() => server.normalizeOnlineProfile_({ ...legacy, saveSchemaVersion: 9 }, '01', 'A'), /Unsupported/);
  assert.throws(() => browser.window.VFIRecovery.migrateProfile({ ...legacy, saveSchemaVersion: 9 }, {}, '01'), /newer game schema/);
});

test('staging data access requires distinct test and production IDs', () => {
  properties.STAGING_MODE = 'true';
  properties.STAGING_SHEET_ID = 'test-sheet';
  delete properties.PRODUCTION_SHEET_ID;
  assert.throws(() => server.data_(), /PRODUCTION_SHEET_ID/);
  properties.PRODUCTION_SHEET_ID = 'test-sheet';
  assert.throws(() => server.data_(), /equals production/);
  properties.PRODUCTION_SHEET_ID = 'real-sheet';
  assert.equal(server.data_().id, 'test-sheet');
  assert.deepEqual(opened, ['test-sheet']);
});
