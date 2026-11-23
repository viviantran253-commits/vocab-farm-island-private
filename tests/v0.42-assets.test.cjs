const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = 'staging/v0.42/assets/companions';
const server = fs.readFileSync('google-apps-script/student-app/Server.gs', 'utf8');
const game = fs.readFileSync('google-apps-script/student-app/GameCode.html', 'utf8');
const html = fs.readFileSync('google-apps-script/student-app/StudentGame.html', 'utf8');

test('all 22 server companions have complete public sprite sets', () => {
  const context = vm.createContext({});
  vm.runInContext(server, context);
  const ids = vm.runInContext('MAGIC_CHARACTERS', context);
  assert.equal(ids.length, 22);
  for (const id of ids) {
    assert.ok(game.includes(`id:'${id}'`) || game.includes(`"id":"${id}"`), `game character ${id}`);
    for (const name of ['growth/01_newborn.png', 'growth/02_baby.png', 'growth/03_young.png', 'growth/04_final.png', 'idle/idle_down.png', 'idle/idle_up.png', 'idle/idle_left.png', 'idle/idle_right.png', 'sheets/walk_down.png', 'sheets/walk_up.png', 'sheets/walk_left.png', 'sheets/walk_right.png']) {
      assert.ok(fs.statSync(path.join(root, id, name)).size > 0, `${id}/${name}`);
    }
  }
});

test('production UI keeps classroom login and has new map controls', () => {
  assert.match(html, /<select id="studentSelect"/);
  assert.match(html, /id="zoomFollow"/);
  assert.match(game, /const ONLINE = true;/);
  assert.match(game, /const BUILD_ID='v0\.43'/);
  assert.doesNotMatch(server, /STAGING_MODE|STAGING_SHEET_ID/);
  assert.doesNotMatch(html, /Staging Candidate|private test Google Sheet/);
  assert.doesNotMatch(game, /Staging classroom/);
});
