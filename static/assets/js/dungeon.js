

dungeonActivity.addEventListener('click', function () {
    dungeonStartPause();
});

const initialDungeonLoad = () => {
    if (localStorage.getItem("dungeonData") !== null) {
        dungeon = JSON.parse(localStorage.getItem("dungeonData"));
        dungeon.status = {
            exploring: false,
            paused: true,
            event: false,
        };
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

const dungeonCounter = () => {
    player.playtime++;
    dungeon.statistics.runtime++;
    dungeonTime.innerHTML = new Date(dungeon.statistics.runtime * 1000).toISOString().slice(11, 19);
    saveData();
}


const loadDungeonProgress = () => {
    if (dungeon.progress.room > dungeon.progress.roomLimit) {
        dungeon.progress.room = 1;
        dungeon.progress.floor++;
    }
    floorCount.innerHTML = `Floor ${dungeon.progress.floor}`;
    roomCount.innerHTML = `Room ${dungeon.progress.room}`;
}

const disarmTrap = (trapType) => {
    let successChance = Math.random() < 0.5; 
    if (successChance) {
        logDungeonEvent(`You successfully disarmed the ${trapType}.`);
    } else {
        logDungeonEvent(`You failed to disarm the ${trapType} and took damage.`);
        playerTakeDamage(); 
    }
    dungeon.status.event = false;
};

const evadeTrap = (trapType) => {
    let successChance = Math.random() < 0.7; 
    if (successChance) {
        logDungeonEvent(`You successfully evaded the ${trapType}.`);
    } else {
        logDungeonEvent(`You failed to evade the ${trapType} and took damage.`);
        playerTakeDamage(); 
    }
    dungeon.status.event = false;
};

const playerTakeDamage = () => {
    const damage = calculateTrapDamage(); 
    player.stats.hp -= damage;
    if (player.stats.hp <= 0) {
        
    }
    playerLoadStats(); 
};

function getBonusIcon(stat) {
    return iconMap[stat] || "ra ra-question";
}



const engageBattle = () => {
    showCombatInfo()
    startCombat(bgmBattleMain);
    console.log("You encountered: ", enemy.name);
    addCombatLog(`You encountered ${enemy.name}.`);
    updateDungeonLog();
}


const mimicBattle = (type) => {
    generateRandomEnemy(type);
    showCombatInfo()
    startCombat(bgmBattleMain);
    console.log("You encountered: ", enemy.name);
    addCombatLog(`You encountered ${enemy.name}.`);
    addDungeonLog(`You encountered ${enemy.name}.`);
}


const guardianBattle = () => {
    incrementRoom();
    generateRandomEnemy("guardian");
    showCombatInfo()
    startCombat(bgmBattleGuardian);
    console.log("You encountered: ", enemy.name);
    addCombatLog(`Floor Guardian ${enemy.name} is blocking your way.`);
    addDungeonLog("You moved to the next floor.");
}


const specialBossBattle = () => {
    generateRandomEnemy("sboss");
    showCombatInfo()
    startCombat(bgmBattleBoss);
    console.log("You encountered: ", enemy.name);
    addCombatLog(`Dungeon Monarch ${enemy.name} has awoken.`);
    addDungeonLog(`Dungeon Monarch ${enemy.name} has awoken.`);
}


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


const goldDrop = () => {
    sfxSell.play();
    let goldValue = randomizeNum(50, 500) * dungeon.progress.floor;
    addDungeonLog(`You found <i class="fas fa-coins" style="color: #FFD700;"></i>${nFormatter(goldValue)}.`);
    player.gold += goldValue;
    playerLoadStats();
}

const nothingEvent = () => {
    const events = [
        "You explored and found nothing.",
        "You found an empty chest.",
        "You found a monster corpse.",
        "You found a corpse.",
        "There is nothing in this area."
    ];

    let eventRoll = randomizeNum(1, 5) - 1; 
    addDungeonLog(events[eventRoll]);
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
    const randomStat = stats[Math.floor(Math.random() * stats.length)];
    const value = statValues[randomStat];

    player.bonusStats[randomStat] += value;
    
    const formatBuffName = (buff) => {
        return buff
            .replace(/([A-Z])/g, " $1") 
            .replace(/^./, (str) => str.toUpperCase()) 
            .replace("Crit ", "Crit"); 
    };
    
    const formattedBuffName = formatBuffName(randomStat);
    addDungeonLog(`You gained ${value}% bonus ${formattedBuffName} from the blessing. (Blessing Lv.${player.blessing} > Blessing Lv.${player.blessing + 1})`);
    
    blessingUp();
    playerLoadStats();
    saveData();
}

const cursedTotem = (curseLvl) => {
    sfxBuff.play();
    dungeon.settings.enemyScaling += 0.1;
    addDungeonLog(`The monsters in the dungeon became stronger and the loot quality improved. (Curse Lv.${curseLvl} > Curse Lv.${curseLvl + 1})`);
    saveData();
}


const ignoreEvent = () => {
    sfxConfirm.play();
    logDungeonEvent("You ignored it and decided to move on.");
}

const logDungeonEvent = (logDungeonMessage) => {
    sfxConfirm.play();
    if (logDungeonMessage) {
        addDungeonLog(logDungeonMessage);
    }
    toggleExploring(dungeon);
}


const incrementRoom = () => {
    dungeon.progress.room++;
    dungeon.action = 0;
    loadDungeonProgress();
}

const blessingUp = () => {
    blessingValidation();
    player.blessing++;
}

const blessingValidation = () => {
    if (player.blessing == undefined) {
        player.blessing = 1;
    }
}