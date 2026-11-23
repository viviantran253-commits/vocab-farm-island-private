const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Sheet {
  constructor(rows = []) { this.rows = rows.map(row => row.slice()); }
  getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; }
  getLastRow() { return this.rows.length; }
  getRange(row, col, height = 1, width = 1) {
    return { getValue: () => this.rows[row - 1]?.[col - 1], setValue: value => { const target = this.rows[row - 1] || (this.rows[row - 1] = []); target[col - 1] = value; }, getValues: () => Array.from({ length: height }, (_, i) => Array.from({ length: width }, (_, j) => this.rows[row - 1 + i]?.[col - 1 + j])), setValues: values => {
      for (let i = 0; i < height; i++) {
        const target = this.rows[row - 1 + i] || (this.rows[row - 1 + i] = []);
        for (let j = 0; j < width; j++) target[col - 1 + j] = values[i][j];
      }
    } };
  }
  appendRow(row) { this.rows.push(row.slice()); }
  hideColumns() {}
  setColumnWidths() {}
}

test('teacher creates an isolated profile once, without changing students', () => {
  const sheets = {
    _Students: new Sheet([['ID', 'Name', 'Salt', 'Hash'], ['01', 'Student 01', 'salt', 'hash']]),
    _Progress: new Sheet([['ID', 'Revision', 'JSON']]),
    _History: new Sheet([['Event ID']]),
    Vocab_11: new Sheet([['English word', 'UK IPA', 'Part of speech', 'Meaning', 'Example meaning']]),
  };
  const context = vm.createContext({
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: name => sheets[name] }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: { getUuid: () => 'new-salt' },
  });
  vm.runInContext(fs.readFileSync('google-apps-script/teacher-dashboard/Admin.gs', 'utf8'), context);
  context.requireTeacher_ = token => { if (token !== 'teacher-token') throw Error('Teacher session required.'); };
  context.sha_ = () => 'hashed-pin';
  assert.throws(() => context.createTeacherTestProfile('student-token'), /Teacher session required/);
  const result = context.createTeacherTestProfile('teacher-token');
  assert.equal(result.created, true);
  assert.equal(result.id, '11');
  assert.match(result.pin, /^\d{4}$/);
  assert.equal(sheets._Students.rows[1][1], 'Student 01');
  assert.equal(sheets._Students.rows[2][0], '11');
  assert.equal(sheets._Students.rows[2][3], 'hashed-pin');
  assert.equal(sheets._Students.rows[2][8], 11);
  assert.equal(sheets.Vocab_11.rows.length, 7);
  assert.equal(context.createTeacherTestProfile('teacher-token').created, false);
  assert.equal(sheets._Students.rows.length, 3);
});

test('online test actions reject student sessions and only update profile 11', () => {
  const context = vm.createContext({
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  });
  vm.runInContext(fs.readFileSync('google-apps-script/student-app/Server.gs', 'utf8'), context);
  let revision = 3;
  const profile = { id: '11', version: 2, gold: 30, level: 1, xp: 0, seeds: { special: 0 }, fenceStock: 0,
    settings: {}, plots: Array.from({ length: 10 }, (_, i) => ({ unlocked: i < 2, crop: i === 0 ? { nextDueAt: Date.now() + 60000, retryAfter: Date.now() + 60000 } : null })) };
  context.requireSession_ = token => ({ id: token === 'teacher-test' ? '11' : '01', name: 'Test' });
  context.data_ = () => ({});
  context.readProgress_ = () => ({ revision, profile, seen: [] });
  context.writeMagicProgress_ = () => ++revision;
  assert.throws(() => context.studentTestAction('student', 'add-gold', null, revision), /unavailable/);
  assert.equal(profile.gold, 30);
  assert.equal(context.studentTestAction('teacher-test', 'add-gold', null, revision).revision, 4);
  assert.equal(profile.gold, 100030);
  assert.equal(context.studentTestAction('teacher-test', 'set-level', 12, revision).profile.level, 12);
  assert.equal(context.studentTestAction('teacher-test', 'growth-seconds', 1, revision).profile.settings.testGrowthSeconds, 1);
  context.studentTestAction('teacher-test', 'ready', null, revision);
  assert.ok(profile.plots[0].crop.nextDueAt < Date.now());
  assert.equal(context.studentTestAction('teacher-test', 'special-seeds', null, revision).profile.seeds.special, 10);
  assert.equal(context.studentTestAction('teacher-test', 'add-gold', null, revision - 1).conflict, true);
});
