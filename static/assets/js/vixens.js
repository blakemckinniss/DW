const recruitVixen = () => {
    const vixenTypes = ["The Cleric", "The Warrior", "The Mage"];
    const statBonuses = ["atk", "def", "hp", "atkspd", "crate", "cdmg", "vamp", "strength", "energy", "luck"];
    const rarities = ["Common", "Rare", "Epic", "Legendary"];
    const bonusValues = [5, 10, 15, 20]; // Corresponding to the rarity
    const recruitmentCosts = [100, 300, 600, 1200]; // Gold cost for each rarity

    const vixenName = `vixen ${Math.floor(Math.random() * 1000)}`;
    const vixenType = vixenTypes[Math.floor(Math.random() * vixenTypes.length)];
    const rarityIndex = Math.floor(Math.random() * rarities.length);
    const statBonus = statBonuses[Math.floor(Math.random() * statBonuses.length)];
    const bonusValue = bonusValues[rarityIndex];
    const recruitmentCost = recruitmentCosts[rarityIndex];
    const rarity = rarities[rarityIndex];

    if (player.gold >= recruitmentCost) {
        player.gold -= recruitmentCost;
        player.vixens.push({
            name: `${vixenName} ${vixenType}`,
            bonus: `${statBonus}+${bonusValue}%`,
            rarity
        });
        addDungeonLog(`You recruited ${vixenName} ${vixenType} for ${recruitmentCost} gold.`, `
            <div class="stat-panel">
                <p class="${rarity}">${vixenName} ${vixenType} - ${statBonus}+${bonusValue}%</p>
            </div>`);
        playerLoadStats();
        updateVixensDisplay();
    } else {
        addDungeonLog("You do not have enough gold to recruit a vixen.");
    }
    dungeon.status.event = false;
};

function updateVixensDisplay() {
    const container = document.querySelector("#vixensContainer");
    container.innerHTML = ''; // Clear existing content

    player.vixens.slice(0, 6).forEach(merc => {
        const bonusIconClass = getBonusIcon(merc.bonus.stat.toLowerCase());
        const mercItem = document.createElement('div');
        mercItem.classList.add('vixen-item');

        // Div for the vixen's name with rarity color
        const nameDiv = document.createElement('div');
        nameDiv.classList.add('vixen-name-top', merc.rarity.toLowerCase());
        nameDiv.innerHTML = `<span class="${merc.rarity.toLowerCase()}">${merc.name}</span>`;
        mercItem.appendChild(nameDiv); // Append the name div before the image

        const img = document.createElement('img');
        img.src = "https://placehold.co/512x768"; // Placeholder image URL for demonstration
        img.alt = "vixen Avatar";
        mercItem.appendChild(img);

        // Div for the vixen's bonus with rarity color
        const bonusDiv = document.createElement('div');
        bonusDiv.classList.add('vixen-bonus');
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
    player.vixens.forEach(recruit => {
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
    player.vixens = [];
    console.log("All recruits have been removed.");
    applyEquipmentStats();
    playerLoadStats();
}