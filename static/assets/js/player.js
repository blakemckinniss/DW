let player = JSON.parse(localStorage.getItem("playerData"));
let inventoryOpen = false;
let materialOpen = false;
let leveled = false;
const lvlupSelect = document.querySelector("#lvlupSelect");
const lvlupPanel = document.querySelector("#lvlupPanel");

const playerExpGain = () => {
    player.exp.expCurr += enemy.rewards.exp;
    player.exp.expCurrLvl += enemy.rewards.exp;

    while (player.exp.expCurr >= player.exp.expMax) {
        playerLvlUp();
    }
    if (leveled) {
        lvlupPopup();
    }

    playerLoadStats();
}

// Levels up the player
const playerLvlUp = () => {
    leveled = true;

    // Calculates the excess exp and the new exp required to level up
    let expMaxIncrease = Math.floor(((player.exp.expMax * 1.1) + 100) - player.exp.expMax);
    if (player.lvl > 100) {
        expMaxIncrease = 1000000;
    }
    let excessExp = player.exp.expCurr - player.exp.expMax;
    player.exp.expCurrLvl = excessExp;
    player.exp.expMaxLvl = expMaxIncrease;

    // Increase player level and maximum exp
    player.lvl++;
    player.exp.lvlGained++;
    player.exp.expMax += expMaxIncrease;

    // Increase player bonus stats per level
    player.bonusStats.hp += 4;
    player.bonusStats.atk += 2;
    player.bonusStats.def += 2;
    player.bonusStats.atkSpd += 0.15;
    player.bonusStats.critRate += 0.1;
    player.bonusStats.critDmg += 0.25;
}

function addBuff(name, durationMinutes) {
    const endTime = new Date(new Date().getTime() + durationMinutes * 60000);
    player.buffs.push({ name, duration: durationMinutes, endTime });
    updateBuffsBanesDisplay();
    saveBuffsBanesToLocalStorage()
}

function addBane(name, durationMinutes) {
    const endTime = new Date(new Date().getTime() + durationMinutes * 60000);
    player.banes.push({ name, duration: durationMinutes, endTime });
    updateBuffsBanesDisplay();
    saveBuffsBanesToLocalStorage()
}

function removeBuff(name) {
    player.buffs = player.buffs.filter(buff => buff.name !== name);
    updateBuffsBanesDisplay();
    saveBuffsBanesToLocalStorage()
}

function removeBane(name) {
    player.banes = player.banes.filter(bane => bane.name !== name);
    updateBuffsBanesDisplay();
    saveBuffsBanesToLocalStorage()
}

function extendBuff(name, additionalMinutes) {
    const buff = player.buffs.find(buff => buff.name === name);
    if (buff) {
        buff.endTime = new Date(buff.endTime.getTime() + additionalMinutes * 60000);
        updateBuffsBanesDisplay();
    }
    saveBuffsBanesToLocalStorage()
}

function extendBane(name, additionalMinutes) {
    const bane = player.banes.find(bane => bane.name === name);
    if (bane) {
        bane.endTime = new Date(bane.endTime.getTime() + additionalMinutes * 60000);
        updateBuffsBanesDisplay();
    }
    saveBuffsBanesToLocalStorage()
}

function updateBuffsBanesDisplay() {
    const buffsPanel = document.querySelector('.buffs');
    const banesPanel = document.querySelector('.banes');
    buffsPanel.innerHTML = '<h4></h4>';
    banesPanel.innerHTML = '<h4></h4>';

    player.buffs.forEach(buff => {
        const timeLeft = calculateTimeLeft(buff.endTime);
        buffsPanel.innerHTML += `<p>${buff.name} (${timeLeft})</p>`;
    });

    player.banes.forEach(bane => {
        const timeLeft = calculateTimeLeft(bane.endTime);
        banesPanel.innerHTML += `<p>${bane.name} (${timeLeft})</p>`;
    });
}

function loadBuffsBanesFromLocalStorage() {
    const buffsBanesData = JSON.parse(localStorage.getItem('playerBuffsBanes'));
    if (buffsBanesData) {
        player.buffs = buffsBanesData.buffs.map(buff => ({
            ...buff,
            endTime: new Date(buff.endTime) // Convert endTime back to Date object
        }));
        player.banes = buffsBanesData.banes.map(bane => ({
            ...bane,
            endTime: new Date(bane.endTime) // Convert endTime back to Date object
        }));
        updateBuffsBanesDisplay();
    }
}

function saveBuffsBanesToLocalStorage() {
    const buffsBanesData = {
        buffs: player.buffs,
        banes: player.banes
    };
    localStorage.setItem('playerBuffsBanes', JSON.stringify(buffsBanesData));
}

function calculateTimeLeft(endTime) {
    const now = new Date();
    const timeLeft = endTime - now;
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = ((timeLeft % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

setInterval(() => {
    const now = new Date();
    if (!player.buffs) player.buffs = [];
    if (!player.banes) player.banes = [];
    player.buffs.forEach(buff => {
        if (buff.endTime < now) {
            removeBuff(buff.name);
        }
    });
    player.banes.forEach(bane => {
        if (bane.endTime < now) {
            removeBane(bane.name);
        }
    });
    updateBuffsBanesDisplay(); // This will continuously update the display
    saveBuffsBanesToLocalStorage(); // Save any changes due to automatic removal
}, 1000);

setInterval(() => {
    if (!dungeon.status.exploring && player.energy < player.maxEnergy) {
        player.energy = Math.min(player.energy + player.energyRegenRate, player.maxEnergy);
        playerLoadStats();
        addDungeonLog("You have regained some energy.", null, "Energy regeneration.");
    }
}, 60000); // 60000 milliseconds = 1 minute


// Refresh the player stats
const playerLoadStats = () => {
    if (!player.vixens) player.vixens = [];
    if (!player.buffs) player.buffs = [];
    if (!player.banes) player.banes = [];
    if (!player.currentWeight) player.currentWeight = () => player.materials.reduce((total, material) => total + (material.weight * material.quantity), 0);
    showEquipment();
    showInventory();
    resetPlayerBonusStats();
    applyEquipmentStats();
    applyRecruitBonuses();
    updateVixensDisplay();
    updateMaterialsDisplay();
    updatePlayerStrengthDisplay();
    calculateStats();

    document.querySelector("#player-energy").textContent = player.energy;
    // + ' (' + player.energyRegenRate + ')'
    document.querySelector("#player-luck").textContent = player.luck;

    let rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    if (player.stats.hp > player.stats.hpMax) {
        player.stats.hp = player.stats.hpMax;
    }
    player.stats.hpPercent = Number((player.stats.hp / player.stats.hpMax) * 100).toFixed(2).replace(rx, "$1");
    player.exp.expPercent = Number((player.exp.expCurrLvl / player.exp.expMaxLvl) * 100).toFixed(2).replace(rx, "$1");

    // Generate battle info for player if in combat
    if (player.inCombat || playerDead) {
        console.log('Player in combat');
        const playerCombatHpElement = document.querySelector('#player-hp-battle');
        const playerHpDamageElement = document.querySelector('#player-hp-dmg');
        const playerExpElement = document.querySelector('#player-exp-bar');
        const playerInfoElement = document.querySelector('#player-combat-info');
        playerCombatHpElement.innerHTML = `&nbsp${nFormatter(player.stats.hp)} / ${nFormatter(player.stats.hpMax)}(${player.stats.hpPercent}%)`;
        playerCombatHpElement.style.width = `${player.stats.hpPercent}%`;
        playerHpDamageElement.style.width = `${player.stats.hpPercent}%`;
        playerExpElement.style.width = `${player.exp.expPercent}%`;
        playerInfoElement.innerHTML = `${player.name} Lv.${player.lvl} (${player.exp.expPercent}%)`;
    }
    // Header
    // document.querySelector("#player-name").innerHTML = `<i class="ra ra-player-pyromaniac"></i>Lv.${player.lvl} ${nFormatter(player.exp.expCurr)}/${nFormatter(player.exp.expMax)} (${player.exp.expPercent}%) <i class="fas fa-coins" style="color: #FFD700;"></i>${nFormatter(player.gold)}`;
    document.querySelector("#player-name").innerHTML = `LVL: ${player.lvl} (${player.exp.expPercent}%)`;
    // ${nFormatter(player.exp.expCurr)}/${nFormatter(player.exp.expMax)}
    // document.querySelector("#player-exp").innerHTML = ``;
    document.querySelector("#player-gold").innerHTML = `<i class="fas fa-coins" style="color: #FFD700;"></i>${nFormatter(player.gold)}`;
    // document.querySelector("#player-strength").innerHTML = `<span id="player-strength">1</span>`;
    // document.querySelector("#player-luck").innerHTML = `<span id="player-luck">1</span>`;
    // document.querySelector("#player-energy").innerHTML = `<span id="player-energy">1</span>`;
    // Combined Player Stats with Bonus Stats
    const combineStatsWithBonus = (base, bonus) => {
        const total = base + (base * (bonus / 100));
        const formattedBonus = formatBonusStat(bonus);
        return `${nFormatter(total)} (${formattedBonus})`;
    };

    // Helper function to format and color code the bonus stats
    const formatBonusStat = (bonus) => {
        let formattedBonus = bonus.toFixed(2).replace(rx, "$1");
        let colorClass = 'neutral'; // default color

        if (bonus > 0) {
            formattedBonus = `+${formattedBonus}`;
            colorClass = 'positive';
        } else if (bonus < 0) {
            colorClass = 'negative';
        }

        return `<span class="${colorClass}">${formattedBonus}%</span>`;
    };

    // Player Stats with Bonus Stats
    playerHpElement.innerHTML = `${nFormatter(player.stats.hp)} / ${nFormatter(player.stats.hpMax)}`;
    playerAtkElement.innerHTML = combineStatsWithBonus(player.stats.atk, player.bonusStats.atk);
    playerDefElement.innerHTML = combineStatsWithBonus(player.stats.def, player.bonusStats.def);
    playerAtkSpdElement.innerHTML = combineStatsWithBonus(player.stats.atkSpd, player.bonusStats.atkSpd);
    playerVampElement.innerHTML = combineStatsWithBonus(player.stats.vamp, player.bonusStats.vamp);
    playerCrateElement.innerHTML = combineStatsWithBonus(player.stats.critRate, player.bonusStats.critRate);
    playerCdmgElement.innerHTML = combineStatsWithBonus(player.stats.critDmg, player.bonusStats.critDmg);

    // Remove the Bonus Stats section as it's now integrated with the base stats
    document.querySelector("#bonus-stats").style.display = 'none';
    console.log('Player stats loaded');
};

function updatePlayerStrengthDisplay() {
    const strengthElement = document.querySelector("#player-strength");
    const currentWeight = player.currentWeight();
    const maxWeight = player.maxWeight;
    strengthElement.textContent = `${currentWeight} / ${maxWeight}`;
}


// Function to reset player's bonus stats to their base values
const resetPlayerBonusStats = () => {
    player.bonusStats = {
        hp: 0,
        atk: 0,
        def: 0,
        atkSpd: 0,
        vamp: 0,
        critRate: 0,
        critDmg: 0,
    };
};

// Opens inventory
const openInventory = () => {
    sfxOpen.play();

    dungeon.status.exploring = false;
    inventoryOpen = true;
    let openInv = document.querySelector('#inventory');
    let dimDungeon = document.querySelector('#dungeon-main');
    openInv.style.display = "flex";
    dimDungeon.style.filter = "brightness(50%)";

    sellAllElement.onclick = function () {
        sfxOpen.play();
        openInv.style.filter = "brightness(50%)";
        let rarity = sellRarityElement.value;

        defaultModalElement.style.display = "flex";
        if (rarity == "All") {
            defaultModalElement.innerHTML = `
            <div class="content">
                <p>Sell all of your equipment?</p>
                <div class="button-container">
                    <button id="sell-confirm">Sell All</button>
                    <button id="sell-cancel">Cancel</button>
                </div>
            </div>`;
        } else {
            defaultModalElement.innerHTML = `
            <div class="content">
                <p>Sell all <span class="${rarity}">${rarity}</span> equipment?</p>
                <div class="button-container">
                    <button id="sell-confirm">Sell All</button>
                    <button id="sell-cancel">Cancel</button>
                </div>
            </div>`;
        }

        let confirm = document.querySelector('#sell-confirm');
        let cancel = document.querySelector('#sell-cancel');
        confirm.onclick = function () {
            sellAll(rarity);
            defaultModalElement.style.display = "none";
            defaultModalElement.innerHTML = "";
            openInv.style.filter = "brightness(100%)";
        };
        cancel.onclick = function () {
            sfxDecline.play();
            defaultModalElement.style.display = "none";
            defaultModalElement.innerHTML = "";
            openInv.style.filter = "brightness(100%)";
        };
    };
    sellRarityElement.onclick = function () {
        sfxOpen.play();
    };
    sellRarityElement.onchange = function () {
        let rarity = sellRarityElement.value;
        sellRarityElement.className = rarity;
    };
}

// Closes inventory
const closeInventory = () => {
    sfxDecline.play();

    let openInv = document.querySelector('#inventory');
    let dimDungeon = document.querySelector('#dungeon-main');
    openInv.style.display = "none";
    dimDungeon.style.filter = "brightness(100%)";
    inventoryOpen = false;
    if (!dungeon.status.paused) {
        dungeon.status.exploring = true;
    }
}

// Continue exploring if inventory is not open and the game is not paused
const continueExploring = () => {
    if (!inventoryOpen && !dungeon.status.paused) {
        dungeon.status.exploring = true;
    }
}

// Shows the level up popup
const lvlupPopup = () => {
    sfxLvlUp.play();
    addCombatLog(`You leveled up! (Lv.${player.lvl - player.exp.lvlGained} > Lv.${player.lvl})`);

    // Recover 20% extra hp on level up
    player.stats.hp += Math.round((player.stats.hpMax * 20) / 100);
    playerLoadStats();

    // Show popup choices
    lvlupPanel.style.display = "flex";
    combatPanel.style.filter = "brightness(50%)";
    const percentages = {
        "hp": 10,
        "atk": 8,
        "def": 8,
        "atkSpd": 3,
        "vamp": 0.5,
        "critRate": 1,
        "critDmg": 6
    };
    generateLvlStats(2, percentages);
}

// Generates random stats for level up popup
const generateLvlStats = (rerolls, percentages) => {
    let selectedStats = [];
    let stats = ["hp", "atk", "def", "atkSpd", "vamp", "critRate", "critDmg"];
    while (selectedStats.length < 3) {
        let randomIndex = Math.floor(Math.random() * stats.length);
        if (!selectedStats.includes(stats[randomIndex])) {
            selectedStats.push(stats[randomIndex]);
        }
    }

    const loadLvlHeader = () => {
        lvlupSelect.innerHTML = `
            <h1>Level Up!</h1>
            <div class="content-head">
                <h4>Remaining: ${player.exp.lvlGained}</h4>
                <button id="lvlReroll">Reroll ${rerolls}/2</button>
            </div>
        `;
    }
    loadLvlHeader();

    const lvlReroll = document.querySelector("#lvlReroll");
    lvlReroll.addEventListener("click", function () {
        if (rerolls > 0) {
            sfxSell.play();
            rerolls--;
            loadLvlHeader();
            generateLvlStats(rerolls, percentages);
        } else {
            sfxDeny.play();
        }
    });

    try {
        for (let i = 0; i < 4; i++) {
            let button = document.createElement("button");
            button.id = "lvlSlot" + i;

            let h3 = document.createElement("h3");
            h3.innerHTML = selectedStats[i].replace(/([A-Z])/g, ".$1").replace(/crit/g, "c").toUpperCase() + " UP";
            button.appendChild(h3);

            let p = document.createElement("p");
            p.innerHTML = `Increase bonus ${selectedStats[i].replace(/([A-Z])/g, ".$1").replace(/crit/g, "c").toUpperCase()} by ${percentages[selectedStats[i]]}%.`;
            button.appendChild(p);

            // Increase the selected stat for player
            button.addEventListener("click", function () {
                sfxItem.play();
                player.bonusStats[selectedStats[i]] += percentages[selectedStats[i]];

                if (player.exp.lvlGained > 1) {
                    player.exp.lvlGained--;
                    generateLvlStats(2, percentages);
                } else {
                    player.exp.lvlGained = 0;
                    lvlupPanel.style.display = "none";
                    combatPanel.style.filter = "brightness(100%)";
                    leveled = false;
                }

                playerLoadStats();
                saveData();
            });

            lvlupSelect.appendChild(button);
        }
    } catch (err) { }
}