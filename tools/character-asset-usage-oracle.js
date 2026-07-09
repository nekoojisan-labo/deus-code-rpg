// character-asset-usage-oracle.js
// Ensures the game keeps character asset roles separated:
// - stand: full-body art
// - bust: dialogue + status/menu portrait
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const chars = ['kaito', 'akari', 'riku', 'yami'];

const html = read('index.html');
const story = read('story-events.js');
let ok = true;

function check(label, condition) {
  console.log(`${condition ? 'OK' : 'NG'} ${label}`);
  ok = ok && condition;
}

console.log('\n=== character asset usage oracle ===\n');

for (const key of chars) {
  check(`${key} stand png exists`, exists(`assets/characters/${key}_stand.png`));
  check(`${key} stand webp exists`, exists(`assets/characters/${key}_stand.webp`));
  check(`${key} bust png exists`, exists(`assets/characters/${key}_bust.png`));
  check(`${key} bust webp exists`, exists(`assets/characters/${key}_bust.webp`));
  check(`${key} stand green source exists`, exists(`assets/characters/source/greenback/${key}_stand_green.png`));
  check(`${key} bust green source exists`, exists(`assets/characters/source/greenback/${key}_bust_green.png`));
}

check('VN dialogue loads bust webp', /assets\/characters\/\$\{key\}_bust\.webp/.test(story));
check('VN dialogue falls back to bust png', /assets\/characters\/\$\{key\}_bust\.png/.test(story));
check('status/menu face loads bust webp', /assets\/characters\/\$\{id\}_bust\.webp/.test(html));
check('legacy menu portrait path loads bust png', /assets\/characters\/\$\{id\}_bust\.png/.test(html));
check('story-events cache key is current bust version', story.includes('20260706-stand-bust-close-character-assets'));
check('index loads bumped story-events script', html.includes('story-events.js?v=74'));
check('no dialogue/status reference to removed portrait_vn_stage', !/(portrait_vn_stage|_portrait_vn\.webp|_portrait_vn\.png)/.test(html + story));
check('no menu/status reference to old portrait webp', !/assets\/characters\/\$\{id\}_portrait\.webp/.test(html));

console.log(`\n${ok ? 'OK character asset role usage is consistent' : 'NG character asset role usage regression detected'}`);
process.exit(ok ? 0 : 1);
