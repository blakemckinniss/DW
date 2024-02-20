class Ledger {
    constructor() {
        this.resources = {};
        this.achievements = [];
        this.craftingRecipes = {};
        this.upgrades = {};
        this.events = [];
        // Initialization
        this.loadGameState(); // Load saved game state if available
    }

    addResource(name, quantity = 0, rate = 0, max = Infinity) {
        this.resources[name] = { quantity, rate, max };
    }

    updateRate(name, newRate) {
        if (this.resources[name]) {
            this.resources[name].rate = newRate;
        }
    }

    incrementResources() {
        for (const resource in this.resources) {
            const res = this.resources[resource];
            res.quantity = Math.min(res.quantity + res.rate, res.max);
        }
        this.saveGameState(); // Save state after incrementing resources
        this.checkAchievements(); // Check achievements on every increment
    }

    saveGameState() {
        const gameState = JSON.stringify(this.resources);
        localStorage.setItem('gameState', gameState);
    }

    loadGameState() {
        const gameState = JSON.parse(localStorage.getItem('gameState'));
        if (gameState) {
            this.resources = gameState;
        }
    }

    addAchievement(name, checkFunction) {
        this.achievements.push({ name, checkFunction, achieved: false });
    }

    checkAchievements() {
        this.achievements.forEach(achievement => {
            if (!achievement.achieved && achievement.checkFunction(this.resources)) {
                achievement.achieved = true;
                console.log(`Achievement unlocked: ${achievement.name}`);
                // Additional logic for unlocking achievements can be added here
            }
        });
    }

    addCraftingRecipe(name, inputs, outputs) {
        this.craftingRecipes[name] = { inputs, outputs };
    }

    craftItem(name) {
        const recipe = this.craftingRecipes[name];
        if (recipe && Object.keys(recipe.inputs).every(input => this.resources[input]?.quantity >= recipe.inputs[input])) {
            Object.entries(recipe.inputs).forEach(([input, amount]) => {
                this.resources[input].quantity -= amount;
            });
            Object.entries(recipe.outputs).forEach(([output, amount]) => {
                if (!this.resources[output]) {
                    this.addResource(output, amount, 0);
                } else {
                    this.resources[output].quantity += amount;
                }
            });
        }
    }

    addUpgrade(name, cost, effect) {
        this.upgrades[name] = { cost, effect, purchased: false };
    }

    purchaseUpgrade(name) {
        const upgrade = this.upgrades[name];
        if (upgrade && !upgrade.purchased && this.resources[upgrade.cost.resource]?.quantity >= upgrade.cost.amount) {
            this.resources[upgrade.cost.resource].quantity -= upgrade.cost.amount;
            upgrade.effect(this); // Apply the effect of the upgrade
            upgrade.purchased = true;
        }
    }

    // Start the incremental resource update process
    startIncrementing(interval = 1000) {
        setInterval(() => this.incrementResources(), interval);
    }
}

// Example usage:
// const gameLedger = new Ledger();
// gameLedger.addResource('gold', 10);
// gameLedger.addResource('wood', 5);

// Adding an upgrade that doubles gold production rate
// gameLedger.addUpgrade('Double Gold Production', { resource: 'gold', amount: 50 }, ledger => {
//     const goldResource = ledger.resources.gold;
//     if (goldResource) {
//         goldResource.rate *= 2;
//         console.log('Gold production rate doubled!');
//     }
// });

// // Function to purchase the upgrade, typically triggered by user action
// function purchaseDoubleGoldProduction() {
//     gameLedger.purchaseUpgrade('Double Gold Production');
// }

// Start the game
// gameLedger.startIncrementing();

// // Periodically check achievements (this could be triggered by various game events instead)
// setInterval(() => gameLedger.checkAchievements(), 5000);

// // Example UI button clicks
// document.getElementById('craftMagicSwordButton').addEventListener('click', craftMagicSword);
// document.getElementById('purchaseDoubleGoldButton').addEventListener('click', purchaseDoubleGoldProduction);

// Achievements, crafting, and upgrades can be added in a similar manner
