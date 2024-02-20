function addTestBuff() {
    const name = "Blessing of Wealth";
    const durationMinutes = 3; // 3 minutes for testing
    addBuff(name, durationMinutes);
    console.log(`Added test buff: ${name} for ${durationMinutes} minutes`);
}
function addTestBane() {
    const name = "Curse of Poverty";
    const durationMinutes = 2; // 2 minutes for testing
    addBane(name, durationMinutes);
    console.log(`Added test bane: ${name} for ${durationMinutes} minutes`);
}
function removeTestBuff() {
    const name = "Blessing of Wealth";
    removeBuff(name);
    console.log(`Removed test buff: ${name}`);
}

function removeTestBane() {
    const name = "Curse of Poverty";
    removeBane(name);
    console.log(`Removed test bane: ${name}`);
}
function extendTestBuff() {
    const name = "Blessing of Wealth";
    const additionalMinutes = 1; // Extend by 1 minute for testing
    extendBuff(name, additionalMinutes);
    console.log(`Extended test buff: ${name} by ${additionalMinutes} minutes`);
}
function extendTestBane() {
    const name = "Curse of Poverty";
    const additionalMinutes = 1; // Extend by 1 minute for testing
    extendBane(name, additionalMinutes);
    console.log(`Extended test bane: ${name} by ${additionalMinutes} minutes`);
}


function addTestRecruit() {
    // Ensure the player's vixens array exists
    if (!player.vixens) {
        player.vixens = [];
    }

    // Define a test vixen with a structured bonus
    const testvixen = {
        name: "Ragnar The Brave",
        bonus: { stat: "atk", value: 10 }, // 10% bonus to ATK
        rarity: "Epic"
    };

    // Add the test vixen to the player's vixens array
    player.vixens.push(testvixen);

    // Log for debugging
    console.log("Added test recruit: ", testvixen);

    // Apply the new recruit bonuses to the player's stats
    applyRecruitBonuses(); // This function will handle the updating of the player stats and UI
    playerLoadStats(); // This function will handle the updating of the player stats and UI
}


function addTestMaterial() {
    const testMaterial = {
        name: "Silver Ore",
        sellValue: 5, // Example sell value
        weight: 2, // Weight per unit
        maxStack: 100, // Maximum quantity per stack
        rarity: "Common", // Rarity of the material
        quantity: 20 // Quantity being added
    };

    addMaterial(testMaterial);
    console.log(`Added ${testMaterial.quantity} of ${testMaterial.name} to inventory.`);
}
function removeTestMaterial(materialName, quantityToRemove) {
    const materialIndex = player.materials.findIndex(material => material.name === materialName);
    if (materialIndex > -1) {
        if (quantityToRemove && player.materials[materialIndex].quantity > quantityToRemove) {
            player.materials[materialIndex].quantity -= quantityToRemove;
            console.log(`Removed ${quantityToRemove} of ${materialName} from inventory.`);
        } else {
            console.log(`Removed all of ${materialName} from inventory.`);
            player.materials.splice(materialIndex, 1); // Remove the material entirely
        }
        updateMaterialsDisplay();
    } else {
        console.log(`${materialName} not found in inventory.`);
    }
}
//removeTestMaterial('Silver Ore', 5)

function setPlayerStrength(newStrength) {
    player.strength = newStrength;
    player.maxWeight = player.strength * 10; // Example formula to calculate max weight
    console.log(`Player's strength set to ${newStrength}.`);
}

function getPlayerStrength() {
    console.log(`Player's current strength is ${player.strength}.`);
}

function resetGame() {
    // Clear all game-related data from localStorage
    localStorage.clear();

    // Reset player stats to initial values
    // player.energy = 100;
    // player.maxEnergy = 100;
    // player.strength = 100; // Assuming this is the initial value
    // player.luck = 1;
    // player.materials = [];
    // player.buffs = [];
    // player.banes = [];
    // player.logEntries = [];
    // // Add any other player properties that need resetting

    // // Reset any other game state variables to their initial values
    // dungeon = {
    //     // Assuming there's a dungeon object that also needs resetting
    //     // Reset its properties to their initial values
    // };

    // Update the UI to reflect the reset state
    // updatePlayerStatsDisplay();
    // updateMaterialsDisplay();
    // Call other UI update functions as necessary

    // Optionally, restart the game or redirect the player to the start menu
    location.reload(); // Uncomment this if you want to reload the page
    // Or any other custom initialization logic for starting a new game
}
