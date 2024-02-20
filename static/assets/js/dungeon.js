// ===== Dungeon Setup =====
// Enables start and pause on button click
dungeonActivity.addEventListener('click', function () {
    dungeonStartPause();
});

// Sets up the initial dungeon
const initialDungeonLoad = () => {
    if (localStorage.getItem("dungeonData") !== null) {
        dungeon = JSON.parse(localStorage.getItem("dungeonData"));
        dungeon.status = {
            exploring: false,
            paused: true,
            event: false,
        };
        dungeon.backlog.length = 2;
        updateDungeonLog();
    }
    loadDungeonProgress();
    dungeonTime.innerHTML = new Date(dungeon.statistics.runtime * 1000).toISOString().slice(11, 19);
    dungeonAction.innerHTML = "Resting...";
    dungeonActivity.innerHTML = "Explore";
    dungeonTime.innerHTML = "00:00:00";
    dungeonTimer = setInterval(dungeonEvent, 1000);
    playTimer = setInterval(dungeonCounter, 1000);
}

const updateDungeonUI = (isPaused) => {
    dungeonAction.innerHTML = isPaused ? "Resting..." : "Exploring...";
    dungeonActivity.innerHTML = isPaused ? "Explore" : "Pause";
};

const dungeonStartPause = () => {
    const { paused, exploring } = dungeon.status;
    dungeon.status.paused = !paused;
    dungeon.status.exploring = !exploring;
    paused ? sfxUnpause.play() : sfxPause.play();
    updateDungeonUI(!paused);
};

// Counts the total time for the current run and total playtime
const dungeonCounter = () => {
    player.playtime++;
    dungeon.statistics.runtime++;
    dungeonTime.innerHTML = new Date(dungeon.statistics.runtime * 1000).toISOString().slice(11, 19);
    saveData();
}

// Loads the floor and room count
const loadDungeonProgress = () => {
    if (dungeon.progress.room > dungeon.progress.roomLimit) {
        dungeon.progress.room = 1;
        dungeon.progress.floor++;
    }
    floorCount.innerHTML = `Floor ${dungeon.progress.floor}`;
    roomCount.innerHTML = `Room ${dungeon.progress.room}`;
}

const disarmTrap = (trapType) => {
    let successChance = Math.random() < 0.5; // Simplified success chance calculation
    if (successChance) {
        logDungeonEvent(`You successfully disarmed the ${trapType}.`);
    } else {
        logDungeonEvent(`You failed to disarm the ${trapType} and took damage.`);
        playerTakeDamage(); // Implement damage to the player
    }
    dungeon.status.event = false;
};

const evadeTrap = (trapType) => {
    let successChance = Math.random() < 0.7; // Simplified success chance calculation
    if (successChance) {
        logDungeonEvent(`You successfully evaded the ${trapType}.`);
    } else {
        logDungeonEvent(`You failed to evade the ${trapType} and took damage.`);
        playerTakeDamage(); // Implement damage to the player
    }
    dungeon.status.event = false;
};

const playerTakeDamage = () => {
    const damage = calculateTrapDamage(); // Implement trap damage calculation
    player.stats.hp -= damage;
    if (player.stats.hp <= 0) {
        // Handle player death
    }
    playerLoadStats(); // Refresh player stats display
};

function getBonusIcon(stat) {
    return iconMap[stat] || "ra ra-question";
}

// ========= Dungeon Choice Events ==========
// Starts the battle
const engageBattle = () => {
    showCombatInfo()
    startCombat(bgmBattleMain);
    console.log("You encountered: ", enemy.name);
    addCombatLog(`You encountered ${enemy.name}.`);
    updateDungeonLog();
}

// Mimic encounter
const mimicBattle = (type) => {
    generateRandomEnemy(type);
    showCombatInfo()
    startCombat(bgmBattleMain);
    console.log("You encountered: ", enemy.name);
    addCombatLog(`You encountered ${enemy.name}.`);
    addDungeonLog(`You encountered ${enemy.name}.`);
}

// Guardian boss fight
const guardianBattle = () => {
    incrementRoom();
    generateRandomEnemy("guardian");
    showCombatInfo()
    startCombat(bgmBattleGuardian);
    console.log("You encountered: ", enemy.name);
    addCombatLog(`Floor Guardian ${enemy.name} is blocking your way.`);
    addDungeonLog("You moved to the next floor.");
}

// Guardian boss fight
const specialBossBattle = () => {
    generateRandomEnemy("sboss");
    showCombatInfo()
    startCombat(bgmBattleBoss);
    console.log("You encountered: ", enemy.name);
    addCombatLog(`Dungeon Monarch ${enemy.name} has awoken.`);
    addDungeonLog(`Dungeon Monarch ${enemy.name} has awoken.`);
}

// Flee from the monster
const fleeBattle = () => {
    let eventRoll = randomizeNum(1, 2);
    if (eventRoll == 1) {
        sfxConfirm.play();
        logDungeonEvent(`You managed to flee.`);
        player.inCombat = false;
        dungeon.status.event = false;
    } else {
        addDungeonLog(`You failed to escape!`);
        showCombatInfo()
        startCombat(bgmBattleMain);
        addCombatLog(`You encountered ${enemy.name}.`);
        addCombatLog(`You failed to escape!`);
    }
}

// Chest event randomizer
const chestEvent = () => {
    sfxConfirm.play();
    let eventRoll = randomizeNum(1, 4);
    if (eventRoll == 1) {
        mimicBattle("chest");
    } else if (eventRoll == 2) {
        if (dungeon.progress.floor == 1) {
            goldDrop();
        } else {
            createEquipmentPrint("dungeon");
        }
        logDungeonEvent
    } else if (eventRoll == 3) {
        goldDrop();
        logDungeonEvent
    } else {
        logDungeonEvent("The chest is empty.");
    }
}

// Calculates Gold Drop
const goldDrop = () => {
    sfxSell.play();
    let goldValue = randomizeNum(50, 500) * dungeon.progress.floor;
    addDungeonLog(`You found <i class="fas fa-coins" style="color: #FFD700;"></i>${nFormatter(goldValue)}.`);
    player.gold += goldValue;
    playerLoadStats();
}

// Non choices dungeon event messages
const nothingEvent = () => {
    let eventRoll = randomizeNum(1, 5);
    if (eventRoll == 1) {
        addDungeonLog("You explored and found nothing.");
    } else if (eventRoll == 2) {
        addDungeonLog("You found an empty chest.");
    } else if (eventRoll == 3) {
        addDungeonLog("You found a monster corpse.");
    } else if (eventRoll == 4) {
        addDungeonLog("You found a corpse.");
    } else if (eventRoll == 5) {
        addDungeonLog("There is nothing in this area.");
    }
}

const statBlessing = () => {
    sfxBuff.play();
    const statValues = {
        hp: 10,
        atk: 8,
        def: 8,
        atkSpd: 3,
        vamp: 0.5,
        critRate: 1,
        critDmg: 6
    };
    const stats = Object.keys(statValues);
    const buff = stats[Math.floor(Math.random() * stats.length)];
    const value = statValues[buff];

    player.bonusStats[buff] += value;

    // Format buff name for display
    const formattedBuffName = buff.replace(/([A-Z])/g, " $1").replace("crit", "Crit").toLowerCase();
    addDungeonLog(`You gained ${value}% bonus ${formattedBuffName} from the blessing. (Blessing Lv.${player.blessing} > Blessing Lv.${player.blessing + 1})`);

    blessingUp();
    playerLoadStats();
    saveData();
}

// Cursed totem offering
const cursedTotem = (curseLvl) => {
    sfxBuff.play();
    dungeon.settings.enemyScaling += 0.1;
    addDungeonLog(`The monsters in the dungeon became stronger and the loot quality improved. (Curse Lv.${curseLvl} > Curse Lv.${curseLvl + 1})`);
    saveData();
}

// Ignore event and proceed exploring
const ignoreEvent = () => {
    sfxConfirm.play();
    logDungeonEvent("You ignored it and decided to move on.");
}

// Ignore event and proceed exploring
const logDungeonEvent = (logDungeonMessage) => {
    sfxConfirm.play();
    if (logDungeonMessage) {
        addDungeonLog(logDungeonMessage);
    }
    toggleExploring(dungeon);
}

// Increase room or floor accordingly
const incrementRoom = () => {
    dungeon.progress.room++;
    dungeon.action = 0;
    loadDungeonProgress();
}

// Increases player total blessing
const blessingUp = () => {
    blessingValidation();
    player.blessing++;
}

// Validates whether blessing exists or not
const blessingValidation = () => {
    if (player.blessing == undefined) {
        player.blessing = 1;
    }
}