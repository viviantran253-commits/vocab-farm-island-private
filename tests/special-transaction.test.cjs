const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function game(initial) {
  const context = vm.createContext({ console });
  vm.runInContext(fs.readFileSync('google-apps-script/student-app/Server.gs', 'utf8'), context);
  const sheets = { _Progress: { writes: 0 }, _History: { writes: 0 }, _MagicLedger: { writes: 0 } };
  const stored = { revision: 4, profile: structuredClone(initial), seen: [] };
  const user = { id: '11', name: 'Teacher Test' };
  context.requireSession_ = () => user;
  context.data_ = () => sheets;
  context.readProgress_ = () => ({ row: 2, revision: stored.revision, profile: structuredClone(stored.profile), seen: stored.seen.slice() });
  context.readWords_ = () => [{ id: 'sheet_11_apple_n', english: 'apple', pos: 'n', meaning: 'quả táo' }];
  context.tab_ = (_, name) => ({
    getLastRow: () => 1,
    getRange: () => ({ setValues: rows => {
      sheets[name].writes++;
      if (name === '_Progress') {
        stored.revision = rows[0][1];
        stored.profile = JSON.parse(rows[0][2]);
        stored.seen = JSON.parse(rows[0][4]);
      }
    } }),
  });
  context.magicLedger_ = () => ({ appendRow: () => { sheets._MagicLedger.writes++; } });
  context.magicDay_ = () => '2026-11-24';
  context.LockService = { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) };
  return { context, sheets, stored };
}

function profile() {
  const plots = Array.from({ length: 10 }, (_, i) => ({ unlocked: i < 2, crop: null }));
  return { version: 2, saveSchemaVersion: 1, id: '11', name: 'Teacher Test', gold: 1000, level: 5,
    seeds: { special: 1 }, harvest: {}, plots, history: [], companions: [], settings: {} };
}
const answer = { eventId: 'ev_12345678_answer', time: Date.now(), source: 'Farm', stage: 'Water',
  wordId: 'sheet_11_apple_n', answer: 'n', attempt: 1 };

test('combined purchase saves pending progress and charges exactly once', () => {
  const { context, sheets, stored } = game(profile());
  const proposed = structuredClone(stored.profile);
  proposed.gold = 975; // unrelated unsaved progress must survive the purchase
  const result = context.studentSpecialBuy('session', 4, JSON.stringify(proposed), [answer]);
  assert.equal(result.gold, 675);
  assert.equal(result.specialSeeds, 2);
  assert.equal(result.logged, 1);
  assert.equal(sheets._Progress.writes, 1);
  assert.equal(sheets._History.writes, 1);
  assert.equal(sheets._MagicLedger.writes, 1);
  assert.equal(context.studentSpecialBuy('session', 4, JSON.stringify(proposed), [answer]).conflict, true);
  assert.equal(stored.profile.gold, 675);
  assert.equal(sheets._MagicLedger.writes, 1);
  assert.equal(sheets._Progress.writes, 1);
});

test('combined first watering saves planting, answer and reveal in one progress write', () => {
  const { context, sheets, stored } = game(profile());
  const proposed = structuredClone(stored.profile);
  proposed.seeds.special = 0;
  proposed.plots[0].crop = { type: 'special', stage: 0, pendingReveal: true, wrong: 0, retryAfter: 0 };
  const result = context.studentSpecialReveal('session', 0, 4, JSON.stringify(proposed), [answer]);
  assert.equal(result.ok, true);
  assert.equal(result.crop.stage, 1);
  assert.equal(result.crop.pendingReveal, undefined);
  assert.equal(result.logged, 1);
  assert.equal(stored.profile.seeds.special, 0);
  assert.equal(sheets._Progress.writes, 1);
  assert.equal(sheets._History.writes, 1);
  assert.equal(sheets._MagicLedger.writes, 1);
  assert.equal(context.studentSpecialReveal('session', 0, 4, JSON.stringify(proposed), [answer]).conflict, true);
  assert.equal(sheets._MagicLedger.writes, 1);
});

test('unconfirmed purchase and unowned planting are rejected without writes', () => {
  const { context, sheets, stored } = game(profile());
  const fake = structuredClone(stored.profile);
  fake.seeds.special = 10;
  assert.throws(() => context.studentSpecialBuy('session', 4, JSON.stringify(fake), []), /Unconfirmed Special Seed/);
  const planted = structuredClone(stored.profile);
  planted.plots[0].crop = { type: 'special', stage: 0, pendingReveal: true };
  assert.throws(() => context.studentSpecialReveal('session', 0, 4, JSON.stringify(planted), []), /requires owned inventory/);
  assert.equal(sheets._Progress.writes, 0);
  assert.equal(sheets._MagicLedger.writes, 0);
});
