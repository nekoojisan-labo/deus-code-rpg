// ==========================================
// SaveSystem — 3スロット・セーブの永続化部品（純関数・ストレージ非依存）
// ------------------------------------------
// localStorage を直接触らず storage インターフェース({getItem,setItem,removeItem})を受け取る。
// state(=serializeGameStateの出力blob)を「メタ封筒」で包んでスロットキーに保存/読込する。
// index.html が localStorage と serialize/apply を配線し、tools/save-oracle.js は Map shim で検証する。
//   封筒: { version, timestamp, state, meta:{location,level,partyCount,chapter,timestamp} }
//   スロットキー: deusCodeSave_1 / _2 / _3   旧単一キー: deusCodeSave
// 不変条件: writeSlot(i) は slotKey(i) だけを書く（他スロット非干渉）／空/壊れ/版違いは readSlot=null。
// ==========================================
const SaveSystem = (() => {
    const VERSION = 2;
    const LEGACY_KEY = 'deusCodeSave';
    const slotKey = (i) => 'deusCodeSave_' + i;
    const SLOTS = [1, 2, 3];

    // 一覧表示用メタ（スロット行のラベルに使う）
    function buildSlotMeta(state) {
        state = state || {};
        const p = state.player || {};
        const party = Array.isArray(state.party) ? state.party : [];
        return {
            location: state.locationName || state.currentMap || '？？？',
            level: p.level || 1,
            partyCount: 1 + party.length,
            chapter: state.chapter || '',
            timestamp: state.timestamp || ''
        };
    }

    function buildEnvelope(state) {
        return { version: VERSION, timestamp: (state && state.timestamp) || '', state, meta: buildSlotMeta(state) };
    }

    // スロット読込: 空/JSON不正/版違い/state欠落 は null（=空スロット扱い・ロード不可）
    function readSlot(storage, i) {
        try {
            const raw = storage.getItem(slotKey(i));
            if (!raw) return null;
            const env = JSON.parse(raw);
            if (!env || env.version !== VERSION || !env.state) return null;
            return { slot: i, occupied: true, envelope: env, state: env.state, meta: env.meta || buildSlotMeta(env.state) };
        } catch (e) { return null; }
    }

    function hasSlot(storage, i) { return readSlot(storage, i) !== null; }

    // 書込: 当該スロットキーのみを書く（兄弟スロットに触れない）
    function writeSlot(storage, i, state) {
        storage.setItem(slotKey(i), JSON.stringify(buildEnvelope(state)));
        return true;
    }

    function listSlots(storage) { return SLOTS.map(i => readSlot(storage, i)); }

    function anyOccupied(storage) { return SLOTS.some(i => hasSlot(storage, i)); }

    // 最新(timestamp最大)の占有スロット番号。無ければ null。
    function latestSlot(storage) {
        let best = null, bestTs = '';
        SLOTS.forEach(i => { const s = readSlot(storage, i); if (s && (s.meta.timestamp || '') >= bestTs) { best = i; bestTs = s.meta.timestamp || ''; } });
        return best;
    }

    // 旧単一セーブ → スロット1へ一度だけ移行（スロット1が空の時のみ・旧キーは残す＝再実行安全）
    function migrateLegacySave(storage) {
        try {
            const raw = storage.getItem(LEGACY_KEY);
            if (!raw) return false;
            if (readSlot(storage, 1)) return false; // 既にスロット1がある→何もしない
            const data = JSON.parse(raw);
            if (!data || data.version !== VERSION) return false;
            storage.setItem(slotKey(1), JSON.stringify(buildEnvelope(data)));
            return true;
        } catch (e) { return false; }
    }

    return {
        VERSION, LEGACY_KEY, SLOTS, slotKey,
        buildSlotMeta, buildEnvelope,
        readSlot, hasSlot, writeSlot, listSlots, anyOccupied, latestSlot, migrateLegacySave
    };
})();
if (typeof window !== 'undefined') window.SaveSystem = SaveSystem;
if (typeof module !== 'undefined' && module.exports) module.exports = { SaveSystem };
