const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('vocabulary categories retain legacy word IDs while showing phrase types', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync('google-apps-script/student-app/Server.gs', 'utf8'), context);
  const rows = [
    ['English word', 'UK IPA', 'Part of speech', 'Meaning', 'Example meaning'],
    ['focus on', '/ˈfəʊ.kəs ɒn/', 'v', 'tập trung vào', 'Focus on the task.'],
    ['take care of', '/teɪk keər əv/', 'v. phr.', 'chăm sóc', 'Take care of your plants.'],
    ['make a decision', '/meɪk ə dɪˈsɪʒ.ən/', 'collocation', 'đưa ra quyết định', 'Make a decision today.'],
    ['piece of cake', '/piːs əv keɪk/', 'idiom', 'dễ như ăn bánh', 'The test is a piece of cake.'],
    ['unknown', '/ʌnˈnəʊn/', 'unsupported', 'không rõ', 'Unknown.'],
  ];
  context.tab_ = () => ({ getDataRange: () => ({ getDisplayValues: () => rows }) });
  const words = context.readWords_({}, '01');
  assert.equal(words.length, 4);
  assert.equal(words[0].pos, 'v.phr');
  assert.equal(words[0].id, 'sheet_01_focus_on_v');
  assert.equal(words[1].pos, 'v.phr');
  assert.equal(words[1].id, 'sheet_01_take_care_of_v');
  assert.equal(words[2].pos, 'collocation');
  assert.equal(words[3].pos, 'idiom');
});

test('map mask keeps land and bridge while excluding shoreline water', () => {
  const context = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync('google-apps-script/student-app/WalkMask.html', 'utf8'), context);
  const mask = context.window.FARM_WALK_MASK;
  const bits = Buffer.from(mask.bits, 'base64');
  const land = (x, y) => { const bit = Math.floor(y / mask.cell) * mask.width + Math.floor(x / mask.cell); return !!(bits[bit >> 3] & (1 << (bit & 7))); };
  for (const [x, y] of [[880, 495], [1760, 565], [1400, 490], [1460, 490], [1500, 490], [402, 933]]) assert.equal(land(x, y), true);
  for (const [x, y] of [[1480, 650], [1500, 700], [100, 1100], [500, 1150], [1920, 800]]) assert.equal(land(x, y), false);
});
