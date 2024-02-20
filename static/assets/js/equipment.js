

const createEquipment = (dungeon, player) => {
    let equipment = {
        category: null,
        attribute: null,
        type: null,
        rarity: null,
        lvl: null,
        tier: null,
        value: null,
        stats: [],
    };

    function assignEquipmentAttribute(equipment, options) {
        const attribute = getRandomElement(Object.keys(options));
        equipment.attribute = attribute;
        if (attribute === "Damage") {
            equipment.type = options[attribute].type;
            equipment.category = getRandomElement(options[attribute].categories);
        } else {
            const { type, category } = Object.entries(options[attribute].types)
                .reduce((acc, [type, categories]) => {
                    if (!acc.category) {
                        acc.type = type;
                        acc.category = getRandomElement(categories);
                    }
                    return acc;
                }, { type: null, category: null });

            equipment.type = type;
            equipment.category = category;
        }
    }

    function assignRarity(equipment, rarityChances) {
        const randomNumber = Math.random();
        let cumulativeChance = 0;
        for (let rarity in rarityChances) {
            cumulativeChance += rarityChances[rarity];
            if (randomNumber <= cumulativeChance) {
                equipment.rarity = rarity;
                return;
            }
        }
    }

    function assignStats(equipment) {
        const { attribute, category } = equipment;
        if (attribute === "Damage") {
            equipment.stats = statsConfig[attribute][category] || statsConfig[attribute].default;
        } else if (attribute === "Defense") {
            equipment.stats = statsConfig[attribute];
        }
    }

    assignEquipmentAttribute(equipment, equipmentOptions);
    assignRarity(equipment, rarityChances);
    assignStats(equipment);

    const { level, enemyScaling } = calculateLevelAndScaling(dungeon);
    equipment.lvl = level;
    equipment.tier = Math.round((enemyScaling - 1) * TIER_CAP);
    let equipmentValue = calculateAndAssignStatsValues(equipment, enemyScaling, player);
    equipment.value = Math.round(equipmentValue * 3);
    player.inventory.equipment.push(JSON.stringify(equipment));

    saveData();
    showInventory();
    showEquipment();

    const itemShow = generateItemShowcase(equipment);
    return itemShow;
};

const equipmentIcon = (equipment) => {
    const iconClass = equipmentIcons[equipment];
    return iconClass ? `<i class="ra ${iconClass}"></i>` : '';
};

const generateStatHtml = (stat) => {
    const key = Object.keys(stat)[0];
    const value = stat[key];
    const formattedKey = key.replace(/([A-Z])/g, " $1").replace(/crit/g, "c").toUpperCase().trim();
    const formattedValue = typeof value === 'number' ? value.toFixed(2).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1") : value;
    return `<li>${formattedKey}+${formattedValue}${typeof value === 'number' ? '%' : ''}</li>`;
};

const generateItemHtml = (item, icon, type) => {
    return `
        <div class="content">
            <h3 class="${item.rarity}">${icon}${item.rarity} ${item.category}</h3>
            <h5 class="lvltier ${item.rarity}"><b>Lv.${item.lvl} Tier ${item.tier || 1}</b></h5>
            <ul>${item.stats.map(generateStatHtml).join('')}</ul>
            <div class="button-container">
                <button id="un-equip">${type}</button>
                <button id="sell-equip"><i class="fas fa-coins" style="color: #FFD700;"></i>${nFormatter(item.value)}</button>
                <button id="close-item-info">Close</button>
            </div>
        </div>`;
};

const setupButtonHandlers = (item, type, i) => {
    const itemInfo = querySelector("#equipmentInfo");
    const dimContainer = querySelector("#inventory");
    querySelector("#un-equip").onclick = () => handleEquipOrUnequip(item, type, i, itemInfo, dimContainer);
    querySelector("#sell-equip").onclick = () => handleSell(item, type, i, dimContainer);
    querySelector("#close-item-info").onclick = () => handleClose(itemInfo, dimContainer);
};

const handleEquipOrUnequip = (item, type, i, itemInfo, dimContainer) => {
    if (type === "Equip" && player.equipped.length >= 6) {
        playSoundEffect('deny');
    } else {
        playSoundEffect(type.toLowerCase());
        const action = type === "Equip" ? { from: 'inventory.equipment', to: 'equipped' } : { from: 'equipped', to: 'inventory.equipment' };

        const fromIndex = player[action.from].findIndex((_, index) => index === i);
        if (fromIndex > -1) {
            player[action.from].splice(fromIndex, 1);
            player[action.to].push(item);
        }
        toggleDisplay("#equipmentInfo", "none");
        updateBrightness("#inventory", "100%");
        playerLoadStats();
        saveData();
        continueExploring();
    }
};

const showItemModal = (modal, displayStyle) => {
    modal.style.display = displayStyle;
};

const handleSellConfirmation = (itemValue, itemIndex, itemArray, modal) => {
    playSoundEffect('sell');
    player.gold += itemValue;
    itemArray.splice(itemIndex, 1);
    showItemModal(modal, "none");
    updateBrightness("#inventory", "100%");
    playerLoadStats();
    saveData();
    continueExploring();
};

const handleCancel = (modal) => {
    playSoundEffect('decline');
    showItemModal(modal, "none");
    toggleDisplay("#equipmentInfo", "flex");
    continueExploring();
};

const handleSell = ({ rarity, category, value }, type, index, dimContainer) => {
    playSoundEffect('open');
    toggleDisplay("#equipmentInfo", "none");
    const modal = querySelector("#defaultModalElement");
    showItemModal(modal, "flex");
    modal.innerHTML = `
        <div class="content">
            <p>Sell <span class="${rarity}">${icon}${rarity} ${category}</span>?</p>
            <div class="button-container">
                <button id="sell-confirm">Sell</button>
                <button id="sell-cancel">Cancel</button>
            </div>
        </div>`;
    const sellConfirmButton = querySelector("#sell-confirm");
    const sellCancelButton = querySelector("#sell-cancel");
    const fromArray = type === "Equip" ? player.inventory.equipment : player.equipped;
    sellConfirmButton.onclick = () => handleSellConfirmation(value, index, fromArray, modal);
    sellCancelButton.onclick = () => handleCancel(modal);
};

const handleClose = (itemInfo, dimContainer) => {
    playSoundEffect('decline');
    toggleDisplay("#equipmentInfo", "none");
    updateBrightness("#inventory", "100%");
    continueExploring();
};

const showItemInfo = (item, icon, type, i) => {
    playSoundEffect('open');
    dungeon.status.exploring = false;
    toggleDisplay("#equipmentInfo", "flex");
    updateBrightness("#inventory", "50%");
    const itemInfo = querySelector("#equipmentInfo");
    itemInfo.innerHTML = generateItemHtml(item, icon, type);
    setupButtonHandlers(item, type, i);
};

function createItemElement(item, icon, type, index) {
    const itemDiv = document.createElement('div');
    itemDiv.className = "items";
    if (type === "Equip") {
        itemDiv.innerHTML = `<p class="${item.rarity}">${icon}${item.rarity} ${item.category}</p>`;
    } else if (type === "Unequip") {
        itemDiv.innerHTML = `<button class="${item.rarity}">${icon}</button>`;
    }
    itemDiv.addEventListener('click', function () {
        showItemInfo(item, icon, type, index);
    });
    return itemDiv;
}

function updateUIList(elementId, items, type) {
    const listElement = document.getElementById(elementId);
    listElement.innerHTML = "";
    if (items.length === 0) {
        listElement.innerHTML = type === "Equip" ? "There are no items available." : "Nothing equipped.";
    }
    items.forEach((item, index) => {
        const icon = equipmentIcon(item.category);
        const parsedItem = type === "Equip" ? JSON.parse(item) : item;
        const itemElement = createItemElement(parsedItem, icon, type, index);
        listElement.appendChild(itemElement);
    });
}

const showInventory = () => {
    updateUIList("playerInventory", player.inventory.equipment, "Equip");
}

const showEquipment = () => {
    updateUIList("playerEquipment", player.equipped, "Unequip");
}

const applyEquipmentStats = () => {
    player.equippedStats = {
        hp: 0,
        atk: 0,
        def: 0,
        atkSpd: 0,
        vamp: 0,
        critRate: 0,
        critDmg: 0
    };
    for (let i = 0; i < player.equipped.length; i++) {
        const item = player.equipped[i];
        item.stats.forEach(stat => {
            for (const key in stat) {
                player.equippedStats[key] += stat[key];
            }
        });
    }
    calculateStats();
}

const unequipAll = () => {
    for (let i = player.equipped.length - 1; i >= 0; i--) {
        const item = player.equipped[i];
        player.equipped.splice(i, 1);
        player.inventory.equipment.push(JSON.stringify(item));
    }
    playerLoadStats();
    saveData();
}

const sellEquipment = (equipment, condition = () => true) => {
    let soldSomething = false;
    const remainingEquipment = [];
    player.inventory.equipment.forEach(item => {
        const equipmentItem = JSON.parse(item);
        if (condition(equipmentItem)) {
            player.gold += equipmentItem.value;
            soldSomething = true;
        } else {
            remainingEquipment.push(item);
        }
    });
    player.inventory.equipment = remainingEquipment;
    return soldSomething;
};

const sellAll = (rarity) => {
    const sellCondition = rarity === "All" 
        ? () => true 
        : equipment => equipment.rarity === rarity;
    const soldSomething = sellEquipment(player.inventory.equipment, sellCondition);
    if (soldSomething) {
        sfxSell.play();
        playerLoadStats();
        saveData();
    } else {
        sfxDeny.play();
    }
};

function formatStatName(statName) {
    return statName.replace(/([A-Z])/g, " $1") 
        .replace(/^./, str => str.toUpperCase()) 
        .replace(/Crit/g, "C"); 
}

function formatStatValue(stat, statName) {
    if (statNamesRequiringPercentage.has(statName)) {
        return `${stat.toFixed(2).replace(regexTrailingZeros, "$1")}%`;
    }
    return stat;
}

function generateStatList(item) {
    return item.stats.map(stat => {
        const statName = Object.keys(stat)[0];
        const formattedStatName = formatStatName(statName);
        const formattedStatValue = formatStatValue(stat[statName], statName);
        return `<li>${formattedStatName}: +${formattedStatValue}</li>`;
    }).join('');
}

const createEquipmentPrint = (condition) => {
    const item = createEquipment();
    const panel = `
        <div class="primary-panel" style="padding: 0.5rem; margin-top: 0.5rem;">
            <h4 class="${item.rarity}"><b>${item.icon} ${item.rarity} ${item.category}</b></h4>
            <h5 class="${item.rarity}"><b>Lv.${item.lvl} Tier ${item.tier}</b></h5>
            <ul>${generateStatList(item)}</ul>
        </div>`;

    const logMessage = condition === "combat" ? `${enemy.name} dropped` : "You got";
    const logFunction = condition === "combat" ? addCombatLog : addDungeonLog;

    logFunction(`<span class="${item.rarity}">${item.rarity} ${item.category}</span>.<br>${panel}`);
};

function generateItemShowcase(equipment) {
    return {
        category: equipment.category,
        rarity: equipment.rarity,
        lvl: equipment.lvl,
        tier: equipment.tier,
        icon: equipmentIcon(equipment.category),
        stats: equipment.stats
    };
}

function calculateAndAssignStatsValues(equipment, enemyScaling, player) {
    let equipmentValue = 0;
    const statTypes = getStatTypes(equipment);
    let loopCount = getLoopCountForRarity(equipment.rarity);
    for (let i = 0; i < loopCount; i++) {
        const statType = statTypes[randomizeNum(0, statTypes.length - 1)];
        const statMultiplier = (enemyScaling - 1) * equipment.lvl;
        const base = MAX_STAT_MULTIPLIERS[statType] || MAX_STAT_MULTIPLIERS.atkDef;
        let statValue = calculateStatScaling(base, statMultiplier, equipment.lvl);

        if (STAT_CAPS[statType] && statValue > STAT_CAPS[statType]) {
            statValue = STAT_CAPS[statType] * randomizeDecimal(0.5, 1);
            i--;
        } else {
            equipmentValue += adjustValueBasedOnStatType(statType, statValue);
            updateEquipmentStats(equipment, statType, statValue);
        }
    }
    return equipmentValue;
}

function adjustValueBasedOnStatType(statType, statValue) {
    const valueMultipliers = {
        atk: 2.5,
        def: 2.5,
        atkSpd: 8.33,
        vamp: 20.83,
        critRate: 20.83,
        critDmg: 8.33,
    };
    return statValue * (valueMultipliers[statType] || 1);
}

function adjustValueBasedOnStatType(statType, statValue) {
    const valueMultipliers = {
        atk: 2.5,
        def: 2.5,
        atkSpd: 8.33,
        vamp: 20.83,
        critRate: 20.83,
        critDmg: 8.33,
    };
    return statValue * (valueMultipliers[statType] || 1);
}

function getLoopCountForRarity(rarity) {
    const loopCounts = {
        Common: 3, Uncommon: 4, Rare: 5, Epic: 6, Legendary: 7, Heirloom: 9
    };
    return loopCounts[rarity] || 3;
}

function calculateLevelAndScaling(dungeon) {
    const maxLvl = Math.min(dungeon.progress.floor * dungeon.settings.enemyLvlGap + (dungeon.settings.enemyBaseLvl - 1), MAX_LEVEL);
    const minLvl = maxLvl - (dungeon.settings.enemyLvlGap - 1);
    const enemyScaling = Math.min(dungeon.settings.enemyScaling, 2);
    const level = randomizeNum(minLvl, maxLvl);
    return { level, enemyScaling };
}

function calculateStatScaling(base, scalingFactor, level) {
    return (base * randomizeDecimal(0.5, 1.5)) + (base * randomizeDecimal(0.5, 1.5) * ((scalingFactor - 1) * level));
}

function updateEquipmentStats(equipment, statType, value) {
    const statIndex = equipment.stats.findIndex(stat => Object.keys(stat)[0] === statType);
    if (statIndex >= 0) {
        equipment.stats[statIndex][statType] += value;
    } else {
        equipment.stats.push({ [statType]: value });
    }
}