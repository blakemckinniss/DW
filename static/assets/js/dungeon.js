const dungeonActivity = document.querySelector("#dungeonActivity");
const dungeonAction = document.querySelector("#dungeonAction");
const dungeonTime = document.querySelector("#dungeonTime");
const floorCount = document.querySelector("#floorCount");
const roomCount = document.querySelector("#roomCount");

let dungeon = {
    rating: 500,
    grade: "E",
    progress: {
        floor: 1,
        room: 1,
        floorLimit: 100,
        roomLimit: 5,
    },
    settings: {
        enemyBaseLvl: 1,
        enemyLvlGap: 5,
        enemyBaseStats: 1,
        enemyScaling: 1.1,
    },
    status: {
        exploring: false,
        paused: true,
        event: false,
    },
    statistics: {
        kills: 0,
        runtime: 0,
    },
    backlog: [],
    action: 0,
};

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

// Start and Pause Functionality
const dungeonStartPause = () => {
    if (!dungeon.status.paused) {
        sfxPause.play();

        dungeonAction.innerHTML = "Resting...";
        dungeonActivity.innerHTML = "Explore";
        dungeon.status.exploring = false;
        dungeon.status.paused = true;
    } else {
        sfxUnpause.play();

        dungeonAction.innerHTML = "Exploring...";
        dungeonActivity.innerHTML = "Pause";
        dungeon.status.exploring = true;
        dungeon.status.paused = false;
    }
}

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
        addDungeonLog(`You successfully disarmed the ${trapType}.`);
        // Implement rewards or progression
    } else {
        addDungeonLog(`You failed to disarm the ${trapType} and took damage.`);
        playerTakeDamage(); // Implement damage to the player
    }
    dungeon.status.event = false;
};

const evadeTrap = (trapType) => {
    let successChance = Math.random() < 0.7; // Simplified success chance calculation
    if (successChance) {
        addDungeonLog(`You successfully evaded the ${trapType}.`);
    } else {
        addDungeonLog(`You failed to evade the ${trapType} and took damage.`);
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
    const iconMap = {
        hp: "fas fa-heart", // Using FontAwesome for HP as per the given HTML
        atk: "ra ra-sword",
        def: "ra ra-round-shield",
        atkspd: "ra ra-player-dodge",
        vamp: "ra ra-dripping-blade",
        crate: "ra ra-knife", // Assuming crate stands for Critical Rate
        cdmg: "ra ra-focused-lightning",
        strength: "ra ra-muscle-up", // Assuming you pass 'strength' for the strength stat
        energy: "ra ra-lightning-bolt", // Note: Duplicate with crate, might need special handling if both are displayed together
        luck: "ra ra-clover"
    };

    // Return the corresponding icon class, or a default icon if the stat isn't found
    return iconMap[stat] || "ra ra-question";
}


const recruitMercenary = () => {
    const mercenaryTypes = ["The Cleric", "The Warrior", "The Mage"];
    const statBonuses = ["atk", "def", "hp", "atkspd", "crate", "cdmg", "vamp", "strength", "energy", "luck"];
    const rarities = ["Common", "Rare", "Epic", "Legendary"];
    const bonusValues = [5, 10, 15, 20]; // Corresponding to the rarity
    const recruitmentCosts = [100, 300, 600, 1200]; // Gold cost for each rarity

    const mercenaryName = `Mercenary ${Math.floor(Math.random() * 1000)}`;
    const mercenaryType = mercenaryTypes[Math.floor(Math.random() * mercenaryTypes.length)];
    const rarityIndex = Math.floor(Math.random() * rarities.length);
    const statBonus = statBonuses[Math.floor(Math.random() * statBonuses.length)];
    const bonusValue = bonusValues[rarityIndex];
    const recruitmentCost = recruitmentCosts[rarityIndex];
    const rarity = rarities[rarityIndex];

    if (player.gold >= recruitmentCost) {
        player.gold -= recruitmentCost;
        player.mercenaries.push({
            name: `${mercenaryName} ${mercenaryType}`,
            bonus: `${statBonus}+${bonusValue}%`,
            rarity
        });
        addDungeonLog(`You recruited ${mercenaryName} ${mercenaryType} for ${recruitmentCost} gold.`, `
            <div class="stat-panel">
                <p class="${rarity}">${mercenaryName} ${mercenaryType} - ${statBonus}+${bonusValue}%</p>
            </div>`);
        playerLoadStats();
        updateMercenariesDisplay();
    } else {
        addDungeonLog("You do not have enough gold to recruit a mercenary.");
    }
    dungeon.status.event = false;
};

function updateMercenariesDisplay() {
    const container = document.querySelector("#mercenariesContainer");
    container.innerHTML = ''; // Clear existing content

    player.mercenaries.slice(0, 6).forEach(merc => {
        const bonusIconClass = getBonusIcon(merc.bonus.stat.toLowerCase());
        const mercItem = document.createElement('div');
        mercItem.classList.add('mercenary-item');

        // Div for the mercenary's name with rarity color
        const nameDiv = document.createElement('div');
        nameDiv.classList.add('mercenary-name-top', merc.rarity.toLowerCase());
        nameDiv.innerHTML = `<span class="${merc.rarity.toLowerCase()}">${merc.name}</span>`;
        mercItem.appendChild(nameDiv); // Append the name div before the image

        const img = document.createElement('img');
        img.src = "https://placehold.co/512x768"; // Placeholder image URL for demonstration
        img.alt = "Mercenary Avatar";
        mercItem.appendChild(img);

        // Div for the mercenary's bonus with rarity color
        const bonusDiv = document.createElement('div');
        bonusDiv.classList.add('mercenary-bonus');
        //<span class="${merc.rarity.toLowerCase()}">
        bonusDiv.innerHTML = `<span><i class="${bonusIconClass}"></i>${merc.bonus.value}%</span>`;
        mercItem.appendChild(bonusDiv); // Append the bonus div after the image

        container.appendChild(mercItem);
    });
}



const applyRecruitBonuses = () => {
    // Reset the bonus stats to base values before applying any new bonuses
    player.bonusStats = {
        hp: 0,
        atk: 0,
        def: 0,
        atkSpd: 0,
        vamp: 0,
        critRate: 0,
        critDmg: 0,
    };

    // Apply bonuses from the equipment as before
    applyEquipmentStats();

    // Accumulate bonuses from recruits
    player.mercenaries.forEach(recruit => {
        if (recruit.bonus) {
            // Assuming bonus.stat is the key and bonus.value is the percentage
            // For example, if bonus.stat is "atk", it will add to player.bonusStats.atk
            player.bonusStats[recruit.bonus.stat] += recruit.bonus.value;
        }
    });

    // Call the function to refresh player stats with the new bonuses
    // playerLoadStats();
};

function removeAllRecruits() {
    // Clear the player's mercenaries array
    player.mercenaries = [];

    // Log for debugging
    console.log("All recruits have been removed.");

    // Reapply equipment stats without recruit bonuses
    applyEquipmentStats();

    // Refresh the player stats to reflect the changes
    playerLoadStats();
}

// ========== Events in the Dungeon ==========
const dungeonEvent = () => {
    if (dungeon.status.exploring && !dungeon.status.event) {
        if (player.energy > 0) {
            player.energy -= player.energyCost;
            playerLoadStats();
        } else {
            dungeon.status.exploring = false;
            addDungeonLog("You are too exhausted to continue exploring.", null, "You ran out of energy.");
        }
        dungeon.action++;
        let choices;
        let eventRoll;
        let eventTypes = ["blessing", "curse", "treasure", "enemy", "enemy", "nothing", "nothing", "nothing", "nothing", "monarch", "trap", "mercenaryCamp"]; // Added "mercenaryCamp" event
        if (dungeon.action > 2 && dungeon.action < 6) {
            eventTypes.push("nextroom");
        } else if (dungeon.action > 5) {
            eventTypes = ["nextroom"];
        }
        const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];

        switch (event) {
            case "nextroom":
                dungeon.status.event = true;
                choices = `
                    <div class="decision-panel">
                        <button id="choice1">Enter</button>
                        <button id="choice2">Ignore</button>
                    </div>`;
                if (dungeon.progress.room == dungeon.progress.roomLimit) {
                    addDungeonLog(`<span class="Heirloom">You found the door to the boss room.</span>`, choices);
                } else {
                    addDungeonLog("You found a door.", choices);
                }
                document.querySelector("#choice1").onclick = function () {
                    sfxConfirm.play();
                    if (dungeon.progress.room == dungeon.progress.roomLimit) {
                        guardianBattle();
                    } else {
                        eventRoll = randomizeNum(1, 3);
                        if (eventRoll == 1) {
                            incrementRoom();
                            mimicBattle("door");
                            addDungeonLog("You moved to the next floor.");
                        } else if (eventRoll == 2) {
                            incrementRoom();
                            choices = `
                                <div class="decision-panel">
                                    <button id="choice1">Open the chest</button>
                                    <button id="choice2">Ignore</button>
                                </div>`;
                            addDungeonLog(`You moved to the next room and found a treasure chamber. There is a <i class="fa fa-toolbox"></i>Chest inside.`, choices);
                            document.querySelector("#choice1").onclick = function () {
                                chestEvent();
                            }
                            document.querySelector("#choice2").onclick = function () {
                                dungeon.action = 0;
                                ignoreEvent();
                            };
                        } else {
                            dungeon.status.event = false;
                            incrementRoom();
                            addDungeonLog("You moved to the next room.");
                        }
                    }
                };
                document.querySelector("#choice2").onclick = function () {
                    dungeon.action = 0;
                    ignoreEvent();
                };
                break;
            case "mercenaryCamp":
                dungeon.status.event = true;
                addDungeonLog("You've stumbled upon a Mercenary Camp. Do you wish to recruit a new ally?", `
                    <div class="decision-panel">
                        <button id="recruitMercenary">Recruit</button>
                        <button id="ignoreMercenary">Ignore</button>
                    </div>`);

                document.querySelector("#recruitMercenary").onclick = recruitMercenary;
                document.querySelector("#ignoreMercenary").onclick = () => {
                    addDungeonLog("You decided to move on.");
                    dungeon.status.event = false;
                };
                break;
            case "treasure":
                dungeon.status.event = true;
                choices = `
                    <div class="decision-panel">
                        <button id="choice1">Open the chest</button>
                        <button id="choice2">Ignore</button>
                    </div>`;
                addDungeonLog(`You found a treasure chamber. There is a <i class="fa fa-toolbox"></i>Chest inside.`, choices);
                document.querySelector("#choice1").onclick = function () {
                    chestEvent();
                }
                document.querySelector("#choice2").onclick = function () {
                    ignoreEvent();
                };
                break;
            case "nothing":
                nothingEvent();
                break;
            case "enemy":
                dungeon.status.event = true;
                choices = `
                    <div class="decision-panel">
                        <button id="choice1">Engage</button>
                        <button id="choice2">Flee</button>
                    </div>`;
                generateRandomEnemy();
                addDungeonLog(`You encountered ${enemy.name}.`, choices);
                player.inCombat = true;
                document.querySelector("#choice1").onclick = function () {
                    engageBattle();
                }
                document.querySelector("#choice2").onclick = function () {
                    fleeBattle();
                }
                break;
            case "blessing":
                eventRoll = randomizeNum(1, 2);
                if (eventRoll == 1) {
                    dungeon.status.event = true;
                    blessingValidation();
                    let cost = player.blessing * (500 * (player.blessing * 0.5)) + 750;
                    choices = `
                        <div class="decision-panel">
                            <button id="choice1">Offer</button>
                            <button id="choice2">Ignore</button>
                        </div>`;
                    addDungeonLog(`<span class="Legendary">You found a Statue of Blessing. Do you want to offer <i class="fas fa-coins" style="color: #FFD700;"></i><span class="Common">${nFormatter(cost)}</span> to gain blessings? (Blessing Lv.${player.blessing})</span>`, choices);
                    document.querySelector("#choice1").onclick = function () {
                        if (player.gold < cost) {
                            sfxDeny.play();
                            addDungeonLog("You don't have enough gold.");
                        } else {
                            player.gold -= cost;
                            sfxConfirm.play();
                            statBlessing();
                        }
                        dungeon.status.event = false;
                    }
                    document.querySelector("#choice2").onclick = function () {
                        ignoreEvent();
                    };
                } else {
                    nothingEvent();
                }
                break;
            case "curse":
                eventRoll = randomizeNum(1, 3);
                if (eventRoll == 1) {
                    dungeon.status.event = true;
                    let curseLvl = Math.round((dungeon.settings.enemyScaling - 1) * 10);
                    let cost = curseLvl * (10000 * (curseLvl * 0.5)) + 5000;
                    choices = `
                            <div class="decision-panel">
                                <button id="choice1">Offer</button>
                                <button id="choice2">Ignore</button>
                            </div>`;
                    addDungeonLog(`<span class="Heirloom">You found a Cursed Totem. Do you want to offer <i class="fas fa-coins" style="color: #FFD700;"></i><span class="Common">${nFormatter(cost)}</span>? This will strengthen the monsters but will also improve the loot quality. (Curse Lv.${curseLvl})</span>`, choices);
                    document.querySelector("#choice1").onclick = function () {
                        if (player.gold < cost) {
                            sfxDeny.play();
                            addDungeonLog("You don't have enough gold.");
                        } else {
                            player.gold -= cost;
                            sfxConfirm.play();
                            cursedTotem(curseLvl);
                        }
                        dungeon.status.event = false;
                    }
                    document.querySelector("#choice2").onclick = function () {
                        ignoreEvent();
                    };
                } else {
                    nothingEvent();
                }
                break;
            case "trap":
                dungeon.status.event = true;
                const trapTypes = ["spike pit", "arrow trap", "magical snare"];
                const selectedTrap = trapTypes[Math.floor(Math.random() * trapTypes.length)];
                choices = `
                    <div class="decision-panel">
                        <button id="choice1">Disarm</button>
                        <button id="choice2">Evade</button>
                    </div>`;
                addDungeonLog(`You encountered a ${selectedTrap}.`, choices);

                document.querySelector("#choice1").onclick = function () {
                    disarmTrap(selectedTrap);
                };
                document.querySelector("#choice2").onclick = function () {
                    evadeTrap(selectedTrap);
                };
                break;
            case "monarch":
                eventRoll = randomizeNum(1, 7);
                if (eventRoll == 1) {
                    dungeon.status.event = true;
                    choices = `
                            <div class="decision-panel">
                                <button id="choice1">Enter</button>
                                <button id="choice2">Ignore</button>
                            </div>`;
                    addDungeonLog(`<span class="Heirloom">You found a mysterious chamber. It seems like there is something sleeping inside.</span>`, choices);
                    document.querySelector("#choice1").onclick = function () {
                        specialBossBattle();
                    }
                    document.querySelector("#choice2").onclick = function () {
                        ignoreEvent();
                    };
                } else {
                    nothingEvent();
                }
        }
    }
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
        addDungeonLog(`You managed to flee.`);
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
        dungeon.status.event = false;
    } else if (eventRoll == 3) {
        goldDrop();
        dungeon.status.event = false;
    } else {
        addDungeonLog("The chest is empty.");
        dungeon.status.event = false;
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

// Random stat buff
const statBlessing = () => {
    sfxBuff.play();
    let stats = ["hp", "atk", "def", "atkSpd", "vamp", "critRate", "critDmg"];
    let buff = stats[Math.floor(Math.random() * stats.length)];
    let value;
    switch (buff) {
        case "hp":
            value = 10;
            player.bonusStats.hp += value;
            break;
        case "atk":
            value = 8;
            player.bonusStats.atk += value;
            break;
        case "def":
            value = 8;
            player.bonusStats.def += value;
            break;
        case "atkSpd":
            value = 3;
            player.bonusStats.atkSpd += value;
            break;
        case "vamp":
            value = 0.5;
            player.bonusStats.vamp += value;
            break;
        case "critRate":
            value = 1;
            player.bonusStats.critRate += value;
            break;
        case "critDmg":
            value = 6;
            player.bonusStats.critDmg += value;
            break;
    }
    addDungeonLog(`You gained ${value}% bonus ${buff.replace(/([A-Z])/g, ".$1").replace(/crit/g, "c").toUpperCase()} from the blessing. (Blessing Lv.${player.blessing} > Blessing Lv.${player.blessing + 1})`);
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
    dungeon.status.event = false;
    addDungeonLog("You ignored it and decided to move on.");
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

// ========= Dungeon Backlog ==========
// Displays every dungeon activity
// Updated updateDungeonLog function to handle choices more flexibly
const updateDungeonLog = (choices) => {
    const logContainer = document.querySelector("#dungeonLog");
    logContainer.innerHTML = ''; // Clear current log entries

    // Calculate the start index to slice the last 10 entries
    const startIndex = Math.max(dungeon.backlog.length - 8, 0);
    const recentEntries = dungeon.backlog.slice(startIndex);

    recentEntries.forEach(message => {
        const messageElement = document.createElement("p");
        messageElement.innerHTML = message;
        logContainer.appendChild(messageElement);
    });

    // If the event has choices, display them
    if (choices) {
        let eventChoices = document.createElement("div");
        eventChoices.innerHTML = choices;
        logContainer.appendChild(eventChoices);
    }

    // Scroll to the bottom of the log container to ensure the most recent entries are visible
    logContainer.scrollTop = logContainer.scrollHeight;
};

/**
 * Enhanced addDungeonLog to accept subject as a string or an object with potential rarity.
 * @param {string} message - The log message with a placeholder for the subject.
 * @param {string|null} choices - Any choices related to the log entry.
 * @param {string|object} subjectObj - The subject of the log entry or an object containing the subject's details.
 */
const addDungeonLog = (message, choices, subjectObj = "") => {
    let subject = subjectObj;
    let rarityClass = ""; // Default class
    
    // If subjectObj is an object and contains a rarity, use it to determine the styling
    if (typeof subjectObj === "object" && subjectObj.rarity) {
        rarityClass = `rarity-${subjectObj.rarity.toLowerCase()}`;
        subject = `<span class="${rarityClass}">${subjectObj.name}</span>`;
    }

    // Replace "<subject>" in the message with the styled subject
    message = message.replace("<subject>", subject);

    dungeon.backlog.push(message);
    updateDungeonLog(choices);
};

// Evaluate a dungeon difficulty
const evaluateDungeon = () => {
    let base = 500;
    // Work in Progress
}