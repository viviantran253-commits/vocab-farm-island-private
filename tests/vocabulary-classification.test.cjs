const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const game = fs.readFileSync('google-apps-script/student-app/GameCode.html', 'utf8');
const between = (start, end) => game.slice(game.indexOf(start), game.indexOf(end));

test('phrasal verbs and verb phrases share one learner choice while retaining raw type', () => {
  const context = vm.createContext({ shuffled: values => values, escapeHTML: String,
    englishExample: word => word.example });
  vm.runInContext(between('const POS_LABELS=', 'const SPECIAL_DISTRACTORS') +
    between('function makeQuestion(', 'function startFarmQuestion('), context);
  for (const raw of ['phrasal', 'v.phr']) {
    const word = { id: raw, pos: raw, english: 'head out', example: 'We head out at dawn.' };
    context.word = word;
    const question = vm.runInContext('makeQuestion(word,0)', context);
    assert.equal(question.correct, 'v.phr');
    assert.equal(question.options.find(option => option.value === question.correct).label, 'Cụm động từ (v. phr.)');
    assert.equal(new Set(question.options.map(option => option.label)).size, question.options.length);
    assert.ok(question.options.every(option => option.value !== 'phrasal'));
    assert.equal(word.pos, raw);
  }
});

test('server accepts merged verb phrase answer without changing word metadata', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync('google-apps-script/student-app/SecurityRules.gs', 'utf8'), context);
  const word = { pos: 'phrasal' };
  assert.equal(context.secAnswer_(word, 'Water', 'v.phr').correct, true);
  assert.equal(context.secAnswer_(word, 'Water', 'phrasal').correct, true);
  assert.equal(context.secAnswer_(word, 'Water', 'v').correct, false);
  assert.equal(context.secAnswer_(word, 'Water', 'v.phr').expected, 'v.phr');
  assert.equal(word.pos, 'phrasal');
});

test('meaning and English distractors omit equivalent duplicate choices', () => {
  const context = vm.createContext({ slug: value => String(value).trim().toLowerCase(),
    editDistance: () => 1, SPECIAL_DISTRACTORS: {} });
  vm.runInContext(between('function distractors(', 'function maskWord('), context);
  context.bank = [
    { id: 'a', english: 'head out', meaning: 'ra ngoài' },
    { id: 'b', english: ' Head   Out ', meaning: ' Ra  Ngoài ' },
    { id: 'c', english: 'go home', meaning: 'về nhà' },
    { id: 'd', english: 'go away', meaning: 'đi xa' },
    { id: 'e', english: 'return', meaning: 'trở về' },
  ];
  context.word = context.bank[0];
  for (const field of ['en', 'meaning']) {
    context.field = field;
    const choices = vm.runInContext('distractors(word,field)', context);
    assert.equal(choices.length, 3);
    assert.equal(new Set(choices.map(value => value.trim().toLowerCase().replace(/\s+/g, ' '))).size, choices.length);
    assert.ok(!choices.some(value => value.trim().toLowerCase().replace(/\s+/g, ' ') ===
      context.word[field === 'en' ? 'english' : 'meaning'].toLowerCase()));
  }
});
