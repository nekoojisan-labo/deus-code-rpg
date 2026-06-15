// ==========================================
// 魔法システム (Magic System)
// ==========================================

class MagicSystem {
    constructor() {
        // 魔法データベース
        this.magicDatabase = {
            // 攻撃魔法
            fire_bolt: {
                id: 'fire_bolt',
                name: 'ファイアボルト',
                emoji: '🔥',
                type: 'offensive',
                mpCost: 8,
                power: 20,
                description: '火炎の矢を放つ',
                price: 500,
                requiredLevel: 2,
                allowedRoles: ['all-rounder', 'mage', 'tank']
            },
            ice_lance: {
                id: 'ice_lance',
                name: 'アイスランス',
                emoji: '❄️',
                type: 'offensive',
                mpCost: 10,
                power: 25,
                description: '氷の槍で敵を貫く',
                price: 700,
                requiredLevel: 4,
                allowedRoles: ['all-rounder', 'mage', 'tank']
            },
            thunder_strike: {
                id: 'thunder_strike',
                name: 'サンダーストライク',
                emoji: '⚡',
                type: 'offensive',
                mpCost: 12,
                power: 30,
                description: '雷を落として攻撃',
                price: 900,
                requiredLevel: 6,
                allowedRoles: ['all-rounder', 'mage', 'tank']
            },
            explosion: {
                id: 'explosion',
                name: 'エクスプロージョン',
                emoji: '💥',
                type: 'offensive',
                mpCost: 20,
                power: 50,
                description: '大爆発を起こす',
                price: 1500,
                requiredLevel: 10,
                allowedRoles: ['all-rounder', 'mage', 'tank']
            },
            // 闇魔法（メイジ＝ヤミの代名詞スキル。加入時から使える攻撃手段）
            dark_pulse: {
                id: 'dark_pulse',
                name: 'ダークパルス',
                emoji: '🌑',
                type: 'offensive',
                mpCost: 7,
                power: 22,
                description: '闇の波動で敵を撃つ',
                price: 450,
                requiredLevel: 1,
                allowedRoles: ['mage', 'all-rounder']
            },
            curse: {
                id: 'curse',
                name: 'カース',
                emoji: '💀',
                type: 'offensive',
                mpCost: 12,
                power: 30,
                description: '呪詛の刃で大きく削る',
                price: 700,
                requiredLevel: 1,
                allowedRoles: ['mage']
            },

            // 回復魔法
            heal: {
                id: 'heal',
                name: 'ヒール',
                emoji: '💚',
                type: 'healing',
                mpCost: 7,
                power: 30,
                description: 'HPを回復する',
                price: 400,
                requiredLevel: 1,
                allowedRoles: ['all-rounder', 'healer']
            },
            mega_heal: {
                id: 'mega_heal',
                name: 'メガヒール',
                emoji: '💚',
                type: 'healing',
                mpCost: 15,
                power: 80,
                description: 'HPを大幅に回復',
                price: 800,
                requiredLevel: 5,
                allowedRoles: ['all-rounder', 'healer']
            },
            // 蘇生魔法（戦闘不能の味方専用。通常回復では復帰できない）
            revive: {
                id: 'revive',
                name: 'リザレクト',
                emoji: '✨',
                type: 'revive',
                mpCost: 20,
                power: 0,
                reviveRatio: 0.5,
                description: '戦闘不能の味方を ふっかつさせる（HP50%）',
                price: 1500,
                requiredLevel: 8,
                allowedRoles: ['healer']
            },

            // 補助魔法
            protect: {
                id: 'protect',
                name: 'プロテクト',
                emoji: '🛡️',
                type: 'support',
                mpCost: 10,
                duration: 3,
                effect: 'defense_up',
                power: 1.5,
                description: '防御力を上げる（3ターン）',
                price: 600,
                requiredLevel: 3,
                allowedRoles: ['all-rounder', 'healer', 'mage']
            },
            haste: {
                id: 'haste',
                name: 'ヘイスト',
                emoji: '💨',
                type: 'support',
                mpCost: 12,
                duration: 3,
                effect: 'speed_up',
                description: '素早さを上げる（3ターン）',
                price: 700,
                requiredLevel: 4,
                allowedRoles: ['all-rounder', 'healer', 'mage']
            },

            // 神威魔法
            kamui_storm: {
                id: 'kamui_storm',
                name: '神威・嵐',
                emoji: '🌪️',
                type: 'kamui',
                mpCost: 25,
                power: 60,
                description: '神の嵐を呼び起こす',
                price: 2000,
                requiredLevel: 8,
                allowedRoles: ['all-rounder']
            },
            kamui_blessing: {
                id: 'kamui_blessing',
                name: '神威・祝福',
                emoji: '✨',
                type: 'kamui',
                mpCost: 20,
                duration: 5,
                effect: 'all_up',
                power: 1.3,
                description: '全能力を上昇させる（5ターン）',
                price: 2500,
                requiredLevel: 12,
                allowedRoles: ['all-rounder']
            }
        };

        // キャラクターごとの習得魔法（characterId -> {magicId: magicData}）
        this.learnedMagicByCharacter = {};
    }
    
    // キャラクターIDを取得
    getCharacterId(character = window.player) {
        if (!character) return 'player';
        return character.characterId || character.name || 'player';
    }

    // 魔法を習得
    learnMagic(magicId, character) {
        console.log('[DEBUG] learnMagic called with:', { magicId, character });

        if (!character) {
            console.error('[ERROR] learnMagic called without character parameter!');
            console.trace();
            return false;
        }

        const magic = this.magicDatabase[magicId];
        if (!magic) {
            console.error('Unknown magic:', magicId);
            return false;
        }

        // 役割チェック
        const characterRole = character.role || 'all-rounder';
        if (!magic.allowedRoles.includes(characterRole)) {
            console.error(`${character.name}の役割（${characterRole}）では${magic.name}を習得できません`);
            return false;
        }

        const charId = this.getCharacterId(character);
        if (!this.learnedMagicByCharacter[charId]) {
            this.learnedMagicByCharacter[charId] = {};
        }

        console.log(`${character.name} learning magic: ${magicId}`);
        this.learnedMagicByCharacter[charId][magicId] = { ...magic };
        console.log('Learned magic:', this.learnedMagicByCharacter[charId]);
        return true;
    }

    // ===== v2 計算ヘルパー =====
    // バフ倍率を取得（character.buffs[stat] = {mul,turns}）。stat: physDef/magDef/atk/mag
    static buffMul(character, stat) {
        const b = character && character.buffs && character.buffs[stat];
        return (b && b.turns > 0 && b.mul) ? b.mul : 1;
    }

    // スキルの basePower（明示優先・旧powerは /30 でフォールブリッジ）
    static skillBasePower(magic) {
        if (magic.basePower != null) return magic.basePower;
        return magic.power ? magic.power / 30 : 1.0;
    }

    // ★スキルダメージ式（攻撃魔法/物理スキル共通）。返り値 {damage, weak, resisted}
    //   物理(scalingStat=attack): floor(攻撃×atkバフ×bp) - floor(物理防御×防御バフ/2)
    //   魔法(scalingStat=magic):  floor(魔力×bp × 属性 × (1-耐性)) - floor(魔法防御×防御バフ/3)
    computeSkillDamage(caster, target, magic) {
        const isPhys = (magic.scalingStat === 'attack');
        const bp = MagicSystem.skillBasePower(magic);
        const atkStat = isPhys ? (caster.attack || 0) * MagicSystem.buffMul(caster, 'atk')
                               : (caster.magic || 0) * MagicSystem.buffMul(caster, 'mag');
        let base = Math.floor(atkStat * bp);
        const element = magic.element || 'none';
        // 属性: 弱点一致1.5・耐性で減衰（物理none/弱点noneは倍率1.0）
        let weak = false;
        if (element !== 'none' && target.weakness && target.weakness === element) weak = true;
        const elemMul = weak ? 1.5 : 1.0;
        const resistMap = target.elementalResistance || null;
        const resist = (resistMap && element !== 'none' && resistMap[element]) ? Math.max(0, Math.min(0.9, resistMap[element])) : 0;
        const variance = Math.floor(base * Math.random() * 0.12);
        // 防御: 物理は physDef/2、魔法は magDef/3（バフで防御側が硬くなる）
        let defRed;
        if (isPhys) {
            const pd = (target.defense || 0) * MagicSystem.buffMul(target, 'physDef');
            defRed = Math.floor(pd / 2);
        } else {
            const mdRaw = (target.magicDefense != null) ? target.magicDefense : Math.floor((target.defense || 0) * 0.5);
            const md = mdRaw * MagicSystem.buffMul(target, 'magDef');
            defRed = Math.floor(md / 3);
        }
        const damage = Math.max(1, Math.floor(base * elemMul * (1 - resist)) + variance - defRed);
        return { damage, weak, resisted: resist > 0 };
    }

    // ★回復量 = floor(魔力 × basePower)
    computeHealAmount(caster, magic) {
        const bp = MagicSystem.skillBasePower(magic);
        return Math.max(1, Math.floor((caster.magic || 0) * bp));
    }

    // ★補助スキルの効果適用（バフ/状態治療）。magic.effect で分岐。
    //   バフは character.buffs[stat] = {mul, turns} に積む。読み手は computeSkillDamage / battle-system。
    applySupportEffect(target, magic) {
        if (!target.buffs) target.buffs = {};
        const dur = magic.duration || 3;
        const setBuff = (stat, mul) => { target.buffs[stat] = { mul, turns: dur }; };
        switch (magic.effect) {
            case 'phys_def_up': setBuff('physDef', magic.buffMul || 1.5); return `${magic.name}！\n${target.name}の ぶつりぼうぎょが あがった！`;
            case 'mag_def_up': setBuff('magDef', magic.buffMul || 1.5); return `${magic.name}！\n${target.name}の まほうぼうぎょが あがった！`;
            case 'both_def_up': setBuff('physDef', magic.buffMul || 1.4); setBuff('magDef', magic.buffMul || 1.4); return `${magic.name}！\n${target.name}の ぼうぎょが あがった！`;
            case 'atk_up': setBuff('atk', magic.buffMul || 1.3); return `${magic.name}！\n${target.name}の こうげきが あがった！`;
            case 'speed_up': target.buffs.haste = { mul: 1, turns: dur }; target.magicSpeedBoost = true; return `${magic.name}！\n${target.name}は すばやさが あがった！`;
            case 'cure_status': target.statusAilments = {}; return `${magic.name}！\n${target.name}の じょうたいいじょうが かいふくした！`;
            case 'taunt': target.taunting = dur; return `${magic.name}！\n${target.name}は てきの こうげきを ひきつけた！`;
            default: setBuff('physDef', 1.3); return `${magic.name}！\n${target.name}は みをかためた！`;
        }
    }

    // 習得済みスキル定義を取得（MPチェック/対象種別の事前判定用）
    getLearnedSkill(character, magicId) {
        const charId = this.getCharacterId(character);
        return (this.learnedMagicByCharacter[charId] || {})[magicId] || null;
    }

    // 魔法を使用（skipMpCost=true: 全体攻撃の2体目以降。MPは呼び出し側で1回だけ消費済み）
    useMagic(magicId, character, target, inBattle = false, skipMpCost = false) {
        const charId = this.getCharacterId(character);
        const learnedMagic = this.learnedMagicByCharacter[charId] || {};
        const magic = learnedMagic[magicId];

        console.log('[DEBUG] useMagic:', {
            magicId,
            charId,
            characterName: character.name,
            learnedMagicKeys: Object.keys(learnedMagic),
            allCharacterIds: Object.keys(this.learnedMagicByCharacter),
            magicFound: !!magic
        });

        if (!magic) {
            return { success: false, message: 'この魔法は習得していない！' };
        }

        // MPチェック＋消費（全体攻撃の2体目以降は skipMpCost で1回だけにする）
        if (!skipMpCost) {
            if (character.mp < magic.mpCost) {
                return { success: false, message: 'MPが足りない！' };
            }
            character.mp -= magic.mpCost;
        }

        let message = '';
        let damage = 0;

        // 魔法タイプ別処理
        switch (magic.type) {
            case 'offensive':
                // 攻撃魔法（★v2: 二系統式 scalingStat×basePower×属性×防御）
                if (!target || !inBattle) {
                    return { success: false, message: '戦闘中にしか使えない！' };
                }
                {
                    const r = this.computeSkillDamage(character, target, magic);
                    damage = r.damage;
                    target.currentHp = Math.max(0, target.currentHp - damage);
                    const tag = r.weak ? '　こうかは ばつぐんだ！' : (r.resisted ? '　こうかは いまひとつ…' : '');
                    message = `${magic.name}！\n${target.name}に ${damage} のダメージ！${tag}`;
                }
                break;

            case 'healing':
                // 回復魔法（★v2: 回復量 = floor(魔力 × basePower)）
                const healTarget = (target && target !== character && typeof target.maxHp === 'number') ? target : character;
                // ★戦闘不能には通常の回復魔法は効かない（蘇生スキルが必要）
                if (healTarget.hp <= 0) {
                    return { success: false, message: 'せんとうふのうには かいふくまほうは きかない！（そせいスキルが ひつよう）' };
                }
                {
                    const heal = this.computeHealAmount(character, magic);
                    const applied = Math.min(heal, healTarget.maxHp - healTarget.hp);
                    healTarget.hp = Math.min(healTarget.maxHp, healTarget.hp + heal);
                    message = `${magic.name}！\n${healTarget.name || character.name}の HPが ${applied} 回復した！`;
                }
                break;

            case 'revive':
                // 蘇生魔法（戦闘不能の味方のみ復活。生存中は無効）
                const reviveTarget = (target && target !== character && typeof target.maxHp === 'number') ? target : character;
                if (reviveTarget.hp > 0) {
                    return { success: false, message: 'その なかまは せんとうふのうではない！' };
                }
                const reviveRatio = magic.reviveRatio || 0.5;
                reviveTarget.hp = Math.max(1, Math.floor(reviveTarget.maxHp * reviveRatio));
                message = `${magic.name}！\n${reviveTarget.name || character.name}が せんとうふのうから ふっかつした！`;
                break;

            case 'support':
                // 補助魔法（★v2: バフ/状態治療。対象は target（味方）or 自分）
                if (!inBattle) {
                    return { success: false, message: '戦闘中にしか使えない！' };
                }
                {
                    const buffTarget = (target && typeof target.maxHp === 'number') ? target : character;
                    message = this.applySupportEffect(buffTarget, magic);
                }
                break;

            case 'kamui':
                // 神威魔法（★v2: scalingStat×basePower。属性/防御は computeSkillDamage で）
                if (!target || !inBattle) {
                    return { success: false, message: '戦闘中にしか使えない！' };
                }
                {
                    const r = this.computeSkillDamage(character, target, magic);
                    damage = r.damage;
                    target.currentHp = Math.max(0, target.currentHp - damage);
                    const tag = r.weak ? '　こうかは ばつぐんだ！' : (r.resisted ? '　こうかは いまひとつ…' : '');
                    message = `${magic.name}！\n神の力が襲いかかる！\n${target.name}に ${damage} のダメージ！${tag}`;
                }
                break;
        }

        // UIを更新
        if (window.updateUI) {
            window.updateUI();
        }

        return {
            success: true,
            message: message,
            damage: damage,
            magic: magic
        };
    }
    
    // 習得済み魔法リストを取得
    getLearnedMagic(character) {
        const charId = this.getCharacterId(character);
        const learnedMagic = this.learnedMagicByCharacter[charId] || {};
        return Object.values(learnedMagic).sort((a, b) => {
            const typeOrder = ['offensive', 'healing', 'support', 'kamui'];
            return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
        });
    }

    // 習得済み神威魔法リストを取得
    getLearnedKamuiMagic(character) {
        const charId = this.getCharacterId(character);
        const learnedMagic = this.learnedMagicByCharacter[charId] || {};
        return Object.values(learnedMagic).filter(magic => magic.type === 'kamui');
    }

    // 魔法を習得しているかチェック
    hasLearned(magicId, character = window.player) {
        const charId = this.getCharacterId(character);
        const learnedMagic = this.learnedMagicByCharacter[charId] || {};
        return !!learnedMagic[magicId];
    }
    
    // 魔法の購入
    buyMagic(magicId, character) {
        const magic = this.magicDatabase[magicId];
        if (!magic) {
            return { success: false, message: 'その魔法は存在しない' };
        }

        // 役割チェック
        const characterRole = character.role || 'all-rounder';
        if (!magic.allowedRoles.includes(characterRole)) {
            return {
                success: false,
                message: `${character.name}の役割では習得できない魔法です`
            };
        }

        // 既に習得済みかチェック
        if (this.hasLearned(magicId, character)) {
            return { success: false, message: 'すでに習得している魔法です' };
        }

        // レベル要件チェック
        if (magic.requiredLevel > character.level) {
            return {
                success: false,
                message: `レベル${magic.requiredLevel}以上で習得可能`
            };
        }

        // 所持金チェック
        if (character.gold < magic.price) {
            return { success: false, message: 'ゴールドが足りない！' };
        }

        character.gold -= magic.price;
        this.learnMagic(magicId, character);

        return {
            success: true,
            message: `${magic.name}を習得した！\n${magic.price}ゴールドを支払った。`
        };
    }

    // === セーブ用: charId→[magicId] ===
    toJSON() {
        const out = {};
        for (const charId in this.learnedMagicByCharacter) {
            out[charId] = Object.keys(this.learnedMagicByCharacter[charId]);
        }
        return out;
    }
    // === ロード用: DBから再構築（既習得は正当なのでrole制約を回避して直接格納） ===
    fromJSON(data) {
        this.learnedMagicByCharacter = {};
        if (!data) return;
        for (const charId in data) {
            this.learnedMagicByCharacter[charId] = {};
            for (const magicId of data[charId]) {
                const magic = this.magicDatabase[magicId];
                if (magic) this.learnedMagicByCharacter[charId][magicId] = { ...magic };
            }
        }
    }
}

// グローバルにエクスポート
window.MagicSystem = MagicSystem;
