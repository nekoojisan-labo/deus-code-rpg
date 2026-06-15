// save-oracle.js — 3スロット・セーブ部品(SaveSystem)を実コードで検証する計器。
// localStorage を Map shim に差し替え、往復整合/スロット隔離/空ガード/破損・版違い/旧セーブ移行/
// 最新スロット選択 を観測する。DOM不要（SaveSystemは純関数・ストレージ非依存）。
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const { SaveSystem } = require(path.join(root, 'save-system.js'));

// localStorage の最小shim（Mapバック）
function makeStorage() {
    const m = new Map();
    return {
        getItem: (k) => (m.has(k) ? m.get(k) : null),
        setItem: (k, v) => { m.set(k, String(v)); },
        removeItem: (k) => { m.delete(k); },
        _keys: () => [...m.keys()],
        _map: m
    };
}
const mkState = (tag) => ({
    version: 2, timestamp: '2026-06-15T0' + tag + ':00:00.000Z',
    currentMap: 'map_' + tag, locationName: '場所' + tag, chapter: '第' + tag + '章',
    playerPos: { x: 100 + tag, y: 200 + tag, facing: 'down' },
    player: { level: tag * 5, name: 'カイト' }, party: tag === 1 ? [] : [{ name: 'アカリ' }],
    storyFlags: { ['flag' + tag]: true }, items: {}, equipment: {}, magic: {}
});

console.log('\n=== 3スロット・セーブ部品 SaveSystem 計器 ===\n');
let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };
const deepEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------- (1) ROUND-TRIP + SLOT ISOLATION ----------
{
    const st = makeStorage();
    const s1 = mkState(1), s2 = mkState(2), s3 = mkState(3);
    SaveSystem.writeSlot(st, 1, s1);
    chk('書込はそのスロットキーのみ（deusCodeSave_1だけ）', deepEq(st._keys().sort(), ['deusCodeSave_1']), st._keys().join(','));
    SaveSystem.writeSlot(st, 2, s2);
    SaveSystem.writeSlot(st, 3, s3);
    const r1 = SaveSystem.readSlot(st, 1), r2 = SaveSystem.readSlot(st, 2), r3 = SaveSystem.readSlot(st, 3);
    chk('スロット1の往復整合（state完全一致）', deepEq(r1.state, s1));
    chk('スロット2/3も独立に往復整合', deepEq(r2.state, s2) && deepEq(r3.state, s3));
    chk('スロット書込が兄弟スロットを壊さない（隔離）', deepEq(r1.state, s1) && deepEq(r2.state, s2));
    chk('メタが復元される（場所/レベル/人数/章/時刻）',
        r2.meta.location === '場所2' && r2.meta.level === 10 && r2.meta.partyCount === 2 && r2.meta.chapter === '第2章',
        JSON.stringify(r2.meta));
    chk('playerPos が state に保持される', r1.state.playerPos.x === 101 && r1.state.playerPos.facing === 'down');
}

// ---------- (2) EMPTY-SLOT GUARD ----------
{
    const st = makeStorage();
    chk('空スロットは readSlot=null', SaveSystem.readSlot(st, 1) === null);
    chk('空スロットは hasSlot=false', SaveSystem.hasSlot(st, 2) === false);
    chk('全空では anyOccupied=false / latestSlot=null', SaveSystem.anyOccupied(st) === false && SaveSystem.latestSlot(st) === null);
    const slots = SaveSystem.listSlots(st);
    chk('listSlots は [null,null,null]', slots.length === 3 && slots.every(s => s === null));
}

// ---------- (3) CORRUPTION / VERSION ----------
{
    const st = makeStorage();
    st.setItem(SaveSystem.slotKey(1), '{壊れたJSON');
    chk('壊れたJSONは readSlot=null（throwしない）', SaveSystem.readSlot(st, 1) === null);
    st.setItem(SaveSystem.slotKey(2), JSON.stringify({ version: 1, state: { a: 1 } }));
    chk('版違い(version!==2)は readSlot=null', SaveSystem.readSlot(st, 2) === null);
    st.setItem(SaveSystem.slotKey(3), JSON.stringify({ version: 2 }));
    chk('state欠落は readSlot=null', SaveSystem.readSlot(st, 3) === null);
}

// ---------- (4) MIGRATION（旧単一セーブ→スロット1・冪等・非破壊） ----------
{
    const st = makeStorage();
    const legacy = mkState(7);
    st.setItem(SaveSystem.LEGACY_KEY, JSON.stringify(legacy));
    chk('移行前: スロット1は空', SaveSystem.readSlot(st, 1) === null);
    const m1 = SaveSystem.migrateLegacySave(st);
    chk('移行でスロット1が埋まる', m1 === true && deepEq(SaveSystem.readSlot(st, 1).state, legacy));
    chk('旧キーは残る（再実行安全）', st.getItem(SaveSystem.LEGACY_KEY) !== null);
    const m2 = SaveSystem.migrateLegacySave(st);
    chk('2回目の移行は no-op（冪等）', m2 === false);
    // スロット1に既存があるとき旧セーブは上書きしない
    const st2 = makeStorage();
    SaveSystem.writeSlot(st2, 1, mkState(1));
    st2.setItem(SaveSystem.LEGACY_KEY, JSON.stringify(mkState(9)));
    SaveSystem.migrateLegacySave(st2);
    chk('スロット1占有時は旧セーブで上書きしない', SaveSystem.readSlot(st2, 1).state.player.level === 5);
}

// ---------- (5) LATEST SLOT（timestamp最大） ----------
{
    const st = makeStorage();
    SaveSystem.writeSlot(st, 1, mkState(1)); // ...T01...
    SaveSystem.writeSlot(st, 3, mkState(3)); // ...T03... 最新
    SaveSystem.writeSlot(st, 2, mkState(2));
    chk('latestSlot は timestamp最大のスロット(3)', SaveSystem.latestSlot(st) === 3, `latest=${SaveSystem.latestSlot(st)}`);
    chk('anyOccupied=true（占有あり）', SaveSystem.anyOccupied(st) === true);
}

console.log(`\n${pass ? '✅ 全PASS: 往復整合/スロット隔離/空ガード/破損・版違い/旧セーブ移行(冪等・非破壊)/最新スロット を実コードで確認' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
