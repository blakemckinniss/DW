let enemy = {
    name: null,
    type: null,
    lvl: null,
    stats: {
        hp: null,
        hpMax: null,
        atk: 0,
        def: 0,
        atkSpd: 0,
        vamp: 0,
        critRate: 0,
        critDmg: 0
    },
    image: {
        name: null,
        type: null,
        size: null
    },
    rewards: {
        exp: null,
        gold: null,
        drop: null
    }
};

const enemyCategories = {
    Offensive: {
        normal: ['Goblin Mage', 'Goblin Archer', 'Wolf', 'Black Wolf', 'Winter Wolf', 'Knight Slime', 'Orc Swordsmaster', 'Orc Axe', 'Orc Archer', 'Orc Mage', 'Red Spider', 'Skeleton Archer', 'Skeleton Swordsmaster', 'Skeleton Mage', 'Skeleton Pirate', 'Skeleton Samurai'],
        guardian: ['Zaart, the Dominator Goblin', 'Banshee, Skeleton Lord', 'Molten Spider', 'Berthelot, the Undead King'],
        sboss: ['Behemoth', 'Zalaras, the Dragon Emperor']
    },
    Defensive: {
        normal: ['Angel Slime', 'Knight Slime', 'Crusader Slime', 'Green Spider', 'Skeleton Knight', 'Skeleton Warrior'],
        guardian: ['Slime King', 'Zodiac Cancer', 'Alfadriel, the Light Titan'],
        sboss: ['Ulliot, the Deathlord']
    },
    Balanced: {
        normal: ['Goblin', 'Slime', 'Angel Slime', 'Knight Slime', 'Orc Swordsmaster', 'Orc Axe', 'Orc Archer', 'Orc Mage', 'Spider', 'Skeleton Knight', 'Skeleton Warrior'],
        guardian: ['Tiamat, the Dragon Knight', 'Nameless Fallen King', 'Zodiac Aries'],
        sboss: ['Ifrit', 'Shiva', 'Thanatos']
    },
    Quick: {
        normal: ['Goblin', 'Goblin Rogue', 'Goblin Archer', 'Wolf', 'Black Wolf', 'Winter Wolf', 'Orc Swordsmaster', 'Spider', 'Red Spider', 'Green Spider', 'Skeleton Swordsmaster', 'Skeleton Pirate', 'Skeleton Samurai'],
        guardian: ['Llyrrad, the Ant Queen', 'Clockwork Spider'],
        sboss: ['Darkness Angel Reaper', 'Naizicher, the Spider Dragon']
    },
    Lethal: {
        normal: ['Goblin Rogue', 'Wolf', 'Black Wolf', 'Winter Wolf', 'Orc Swordsmaster', 'Orc Axe', 'Red Spider', 'Skeleton Swordsmaster', 'Skeleton Samurai'],
        guardian: ['Aragorn, the Lethal Wolf', 'Cerberus Ptolemaios', 'Hellhound Inferni'],
        sboss: ['Blood Manipulation Feral']
    }
};

const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

const generateRandomEnemy = (condition) => {
    const enemyTypes = Object.keys(enemyCategories);
    const type = getRandomItem(enemyTypes);
    const maxLvl = 10; 
    const minLvl = 1; 
    enemy.lvl = condition === "guardian" ? minLvl : condition === "sboss" ? maxLvl : randomizeNum(minLvl, maxLvl);
    if (condition === "chest") {
        enemy.name = "Mimic";
    } else if (condition === "door") {
        enemy.name = "Door Mimic";
    } else {
        const enemyList = enemyCategories[type][condition] || enemyCategories[type].normal;
        enemy.name = getRandomItem(enemyList);
    }
    enemy.type = type; 
    setEnemyStats(type, condition);
    setEnemyImg(); 
    return enemy;
};

const enemyTypeStats = {
    Offensive: { hpMax: [300, 370], atk: [70, 100], def: [20, 50], atkSpd: [0.2, 0.4], critRate: [1, 4], critDmg: [6.5, 7.5] },
    Defensive: { hpMax: [400, 500], atk: [40, 70], def: [40, 70], atkSpd: [0.1, 0.3], critRate: [0, 0], critDmg: [0, 0] },
    Balanced: { hpMax: [320, 420], atk: [50, 80], def: [30, 60], atkSpd: [0.15, 0.35], critRate: [0.5, 1.5], critDmg: [1, 3] },
    Quick: { hpMax: [300, 370], atk: [50, 80], def: [30, 60], atkSpd: [0.35, 0.45], critRate: [1, 4], critDmg: [3, 6] },
    Lethal: { hpMax: [300, 370], atk: [70, 100], def: [20, 50], atkSpd: [0.15, 0.35], critRate: [4, 8], critDmg: [6, 9] }
};

const applyStatRange = (typeStats) => {
    const stats = {};
    for (const stat in typeStats) {
        const [min, max] = typeStats[stat];
        stats[stat] = stat === 'atkSpd' || stat.includes('crit') ? randomizeDecimal(min, max) : randomizeNum(min, max);
    }
    stats.hp = 0; 
    stats.vamp = 0; 
    return stats;
};

const applyConditionModifiers = (condition, stats) => {
    const modifiers = {
        guardian: { hpMax: 1.5, atk: 1.3, def: 1.3, critRate: 1.1, critDmg: 1.2 },
        sboss: { hpMax: 6, atk: 2, def: 2, critRate: 1.1, critDmg: 1.3 }
    };
    const modifier = modifiers[condition];
    if (modifier) {
        for (const stat in modifier) {
            stats[stat] *= modifier[stat];
        }
    }
};

const applyDungeonMultipliers = (stats) => {
    const { enemyMultipliers, progress, settings } = dungeon;
    let floorMultiplier = Math.max(progress.floor / 3, 1);
    for (const stat in stats) {
        if (['hpMax', 'atk', 'def'].includes(stat)) {
            stats[stat] = Math.round((stats[stat] * floorMultiplier) * enemyMultipliers[stat]);
        } else {
            stats[stat] *= enemyMultipliers[stat];
        }
    }
};

const setEnemyStats = (type, condition) => {
    enemy.stats = applyStatRange(enemyTypeStats[type] || {});
    ensureDungeonMultipliers();
    applyStatAdjustments();
    applyConditionModifiers(condition, enemy.stats);
    applyDungeonMultipliers(enemy.stats);
    finalizeStats();
};

const ensureDungeonMultipliers = () => {
    if (dungeon.enemyMultipliers === undefined) {
        dungeon.enemyMultipliers = { hp: 1, atk: 1, def: 1, atkSpd: 1, vamp: 1, critRate: 1, critDmg: 1 };
    }
};
const applyStatAdjustments = () => {
    const { settings, enemyMultipliers } = dungeon;
    for (const stat in enemy.stats) {
        if (['hpMax', 'atk', 'def'].includes(stat)) {
            enemy.stats[stat] += Math.round(enemy.stats[stat] * ((settings.enemyScaling - 1) * enemy.lvl));
        } else if (stat === 'atkSpd') {
            enemy.stats[stat] += enemy.stats[stat] * (((settings.enemyScaling - 1) / 4) * enemy.lvl);
        } else if (['critRate', 'critDmg'].includes(stat)) {
            enemy.stats[stat] += enemy.stats[stat] * (((settings.enemyScaling - 1) / 4) * enemy.lvl);
        }
    }
};

const finalizeStats = () => {
    enemy.stats.hp = enemy.stats.hpMax;
    enemy.stats.hpPercent = 100;
    if (enemy.stats.atkSpd > 2.5) {
        enemy.stats.atkSpd = 2.5;
    }
    calculateRewards();
};

const calculateRewards = () => {
    const expYield = Object.keys(enemy.stats).reduce((acc, stat) => {
        let statExp;
        if (['hpMax', 'atk', 'def'].includes(stat)) {
            statExp = enemy.stats[stat] * 1.5;
        } else if (['atkSpd', 'critRate', 'critDmg'].includes(stat)) {
            statExp = enemy.stats[stat] * 3; 
        } else if (['vamp', 'hp'].includes(stat)) {
            statExp = enemy.stats[stat] * 2; 
        } else {
            statExp = 0;
        }
        return acc + statExp;
    }, 0);

    let expCalculation = expYield / 20;
    enemy.rewards.exp = Math.round(expCalculation + expCalculation * (enemy.lvl * 0.1));
    if (enemy.rewards.exp > 1000000) {
        enemy.rewards.exp = 1000000 * randomizeDecimal(0.9, 1.1);
    }

    enemy.rewards.gold = Math.round((enemy.rewards.exp * randomizeDecimal(0.9, 1.1)) * 1.5);
    enemy.rewards.drop = randomizeNum(1, 3) === 1;
};

const enemyImageMap = {
    'Goblin': { name: 'goblin', size: '50%' },
    'Goblin Rogue': { name: 'goblin_rogue', size: '50%' },
    'Goblin Archer': { name: 'goblin_archer', size: '50%' },
    'Goblin Mage': { name: 'goblin_mage', size: '50%' },
    'Wolf': { name: 'wolf', size: '50%' },
    'Black Wolf': { name: 'wolf_black', size: '50%' },
    'Winter Wolf': { name: 'wolf_winter', size: '50%' },
    'Skeleton Pirate': { name: 'skeleton_pirate', size: '50%' },
    'Skeleton Samurai': { name: 'skeleton_samurai', size: '50%' },
    'Skeleton Warrior': { name: 'skeleton_warrior', size: '50%' },
    'Mimic': { name: 'mimic', size: '50%' },
    'Door Mimic': { name: 'mimic_door', size: '50%' },
    'Zaart, the Dominator Goblin': { name: 'goblin_boss', size: '70%' },
    'Banshee, Skeleton Lord': { name: 'skeleton_boss', size: '50%' },
    'Zalaras, the Dragon Emperor': { name: 'zalaras', size: '70%' }
};

const setEnemyImg = () => {
    enemy.image.type = '.png';
    if (enemy.name === 'Skeleton Mage') {
        enemy.image.name = `skeleton_mage${randomizeNum(1, 2)}`;
        enemy.image.size = '50%';
    } else {
        const imageInfo = enemyImageMap[enemy.name] || { name: 'placeholder', size: '50%' };
        enemy.image.name = imageInfo.name;
        enemy.image.size = imageInfo.size;
    }
};

const updateEnemyHpStats = () => {
    if (enemy.stats.hp > enemy.stats.hpMax) {
        enemy.stats.hp = enemy.stats.hpMax;
    }
    enemy.stats.hpPercent = formatPercent((enemy.stats.hp / enemy.stats.hpMax) * 100);
};

const updateEnemyHpUI = () => {
    const enemyHpElement = document.querySelector('#enemy-hp-battle');
    const enemyHpDamageElement = document.querySelector('#enemy-hp-dmg');
    const hpDisplay = `&nbsp${nFormatter(enemy.stats.hp)}/${nFormatter(enemy.stats.hpMax)}<br>(${enemy.stats.hpPercent}%)`;

    enemyHpElement.innerHTML = hpDisplay;
    enemyHpElement.style.width = `${enemy.stats.hpPercent}%`;
    enemyHpDamageElement.style.width = `${enemy.stats.hpPercent}%`;
};

const logEnemyHpStats = () => {
    console.log(`Enemy HP: ${enemy.stats.hp}/${enemy.stats.hpMax} (${enemy.stats.hpPercent}%)`);
};

const enemyLoadStats = () => {
    updateEnemyHpStats();
    updateEnemyHpUI();
    logEnemyHpStats();
};