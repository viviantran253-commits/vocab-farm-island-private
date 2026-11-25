const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('google-apps-script/student-app/Server.gs', 'utf8');
const properties = { SHEET_ID: 'private-teacher-sheet', ASSET_BASE_URL: 'https://example.github.io/vocab-farm-island-private/' };
let template;
const server = vm.createContext({
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => properties[key] || '' }) },
  SpreadsheetApp: { openById: id => ({ id }) },
  HtmlService: {
    createTemplateFromFile: name => (template = {
      getRawContent: () => `raw:${name}`,
      evaluate: () => ({ setTitle: title => ({ title, addMetaTag: (name, content) => ({ title, name, content }) }) }),
    }),
    createHtmlOutput: value => value,
  },
});
vm.runInContext(source, server);

test('official deployment uses existing Sheet property and root asset directory', () => {
  assert.equal(server.data_().id, 'private-teacher-sheet');
  assert.equal(server.include('GameCode'), 'raw:GameCode');
  assert.equal(server.doGet().title, 'Vocab Farm Island');
  assert.equal(server.doGet().name, 'viewport');
  assert.match(server.doGet().content, /width=device-width/);
  assert.equal(template.assetBaseUrl, 'https://example.github.io/vocab-farm-island-private/');
});

test('official migration preserves existing student progress and unknown item IDs', () => {
  const existing = {
    version: 2, id: '01', gold: 456, level: 5, xp: 12, xpTotal: 789,
    seeds: { carrot: 2, retiredSeed: 1 }, harvest: { corn: 3 },
    plots: Array.from({ length: 10 }, (_, i) => ({ unlocked: i < 4, crop: i === 0 ? { type: 'carrot', stage: 2, nextDueAt: 123 } : null })),
    orders: [{ id: 'old-order' }], history: [{ wordId: 'word-1' }], sales: [], badges: [],
    daily: { day: '2026-11-20', correct: 2 }, weekly: { week: '2026-W47', correct: 4 },
    position: { x: 900, y: 500 }, ownedRetiredItem: 'legacy-id',
  };
  const original = JSON.stringify(existing);
  const migrated = server.normalizeOnlineProfile_(existing, '01', 'Student 01');
  assert.equal(JSON.stringify(existing), original);
  for (const key of ['gold', 'level', 'xp', 'xpTotal', 'seeds', 'harvest', 'plots', 'orders', 'history', 'daily', 'weekly', 'position', 'ownedRetiredItem']) {
    assert.equal(JSON.stringify(migrated[key]), JSON.stringify(existing[key]), key);
  }
  assert.equal(migrated.saveSchemaVersion, 1);
  assert.equal(JSON.stringify(migrated.companions), '[]');
  assert.throws(() => server.normalizeOnlineProfile_(existing, '02', 'Student 02'), /ID mismatch/);
});

class Sheet {
  constructor(rows) { this.rows = rows.map(row => row.slice()); }
  getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; }
  getLastRow() { return this.rows.length; }
  getRange(row, col, height = 1, width = 1) {
    return { setValues: values => {
      for (let i = 0; i < height; i++) {
        const target = this.rows[row - 1 + i] || (this.rows[row - 1 + i] = []);
        for (let j = 0; j < width; j++) target[col - 1 + j] = values[i][j];
      }
    } };
  }
  appendRow(row) { this.rows.push(row.slice()); }
  deleteRows(start, count) { this.rows.splice(start - 1, count); }
}

test('teacher reset archives Special Seed ledger without changing another student', () => {
  const sheets = {
    _Students: new Sheet([['ID', 'Name', 'Salt', 'Hash', 'Failed', 'Locked', 'Version', 'Updated'], ['01', 'An', 'salt1', 'hash1', 0, 0, 3, ''], ['02', 'Bee', 'salt2', 'hash2', 0, 0, 7, '']]),
    _Progress: new Sheet([['ID', 'Revision', 'JSON', 'Updated', 'Seen'], ['01', 10, JSON.stringify({ gold: 900 }), '', '[]'], ['02', 4, JSON.stringify({ gold: 50 }), '', '[]']]),
    _History: new Sheet([Array(11).fill('header'), ['event1', '', '01', 'An', '', '', '', '', '', '', 1], ['event2', '', '02', 'Bee', '', '', '', '', '', '', 1]]),
    _MagicLedger: new Sheet([Array(8).fill('header'), ['', '01', 'purchase', '2026-11-21', '', '', '', 10], ['', '02', 'purchase', '2026-11-21', '', '', '', 4]]),
    _ResetArchive: new Sheet([Array(17).fill('header')]),
  };
  const admin = vm.createContext({
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: name => sheets[name] }) },
    Utilities: { getUuid: () => 'reset-id' },
  });
  vm.runInContext(fs.readFileSync('google-apps-script/teacher-dashboard/Admin.gs', 'utf8'), admin);
  vm.runInContext('requireTeacher_ = () => {}', admin);
  assert.throws(() => admin.resetStudentProgress('teacher-session', '01', '02'), /Type the selected/);
  const result = admin.resetStudentProgress('teacher-session', '01', '01');
  assert.equal(result.archivedAnswers, 1);
  assert.equal(result.archivedMagicEvents, 1);
  assert.equal(sheets._Students.rows[1][3], 'hash1');
  assert.equal(sheets._Students.rows[1][6], 4);
  assert.equal(sheets._Students.rows[2][6], 7);
  const fresh = JSON.parse(sheets._Progress.rows[1][2]);
  assert.equal(fresh.level, 1);
  assert.equal(fresh.gold, 30);
  assert.equal(fresh.saveSchemaVersion, 1);
  assert.equal(JSON.stringify(fresh.companions), '[]');
  assert.equal(sheets._Progress.rows[2][1], 4);
  assert.equal(sheets._History.rows[1][2], '02');
  assert.equal(sheets._MagicLedger.rows[1][1], '02');
  assert.equal(sheets._ResetArchive.rows.length, 4);
});
