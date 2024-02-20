class PlayerInventory {
    constructor() {
        this.materials = [];
        this.maxWeight = 100; // Example max weight
    }

    currentWeight() {
        return this.materials.reduce((total, material) => total + (material.weight * material.quantity), 0);
    }

    canAddMaterial(material) {
        const addedWeight = this.currentWeight() + (material.weight * material.quantity);
        return addedWeight <= this.maxWeight;
    }

    findMaterialByName(name) {
        return this.materials.find(m => m.name === name);
    }

    addMaterial(material) {
        if (!this.canAddMaterial(material)) {
            console.log("Cannot acquire more materials due to weight limit.");
            return;
        }

        const existingMaterial = this.findMaterialByName(material.name);
        if (existingMaterial && (existingMaterial.quantity + material.quantity) <= existingMaterial.maxStack) {
            existingMaterial.quantity += material.quantity;
        } else if (!existingMaterial) {
            this.materials.push(material);
        }

        updateMaterialsDisplay();
    }
}

function updateMaterialsDisplay() {
    const materialsPanel = document.querySelector("#materialsPanel");
    materialsPanel.innerHTML = "<div class='bagTitle'><h4></h4></div>";
    player.materials.forEach((material, index) => {
        materialsPanel.appendChild(createMaterialElement(material, index));
    });
}

function createMaterialElement(material, index) {
    const materialElement = document.createElement("p");
    const iconSrc = material.icon?.trim() !== "" ? material.icon : "/assets/materials/loot_bag.png";
    materialElement.innerHTML = `<img src="${iconSrc}" alt="${material.name} Icon" style="width: 32px; height: 32px; margin-top: 0px; vertical-align: middle;"> <span class="${material.rarity}">${material.name} (${material.quantity})</span>`;
    materialElement.classList.add("clickable-material");
    materialElement.addEventListener("click", () => openMaterialModal(material, index));
    return materialElement;
}

function openMaterialModal(material, index) {
    const modal = document.querySelector("#materialModal");
    document.querySelector("#modalMaterialName").textContent = `${material.name} (${material.quantity})`;
    const actionsContainer = document.querySelector("#materialActions");
    actionsContainer.innerHTML = "";

    if (material.sellValue) {
        actionsContainer.appendChild(createSellButton(material, index));
    }

    const dropButton = document.createElement("button");
    dropButton.textContent = "Drop";
    dropButton.addEventListener("click", () => dropMaterial(index));
    actionsContainer.appendChild(dropButton);

    modal.style.display = "flex";
}

function createSellButton(material, index) {
    const sellButton = document.createElement("button");
    sellButton.textContent = "Sell";
    const sellAction = material.quantity > 1 ? () => {
        const quantityToSell = parseInt(prompt("Enter quantity to sell:"));
        sellMaterial(index, quantityToSell);
    } : () => sellMaterial(index, 1);
    sellButton.addEventListener("click", sellAction);
    return sellButton;
}

function sellMaterial(index, quantityToSell) {
    const material = player.materials[index];
    quantityToSell = Math.min(quantityToSell, material.quantity);

    if (quantityToSell <= 0) return;
    
    player.gold += quantityToSell * material.sellValue;
    material.quantity -= quantityToSell;
    if (material.quantity === 0) {
        player.materials.splice(index, 1);
    }
    updateMaterialsDisplay();
    playerLoadStats(); // Assuming this function exists
    closeMaterial();
}

// Assuming useMaterial, dropMaterial, and closeMaterial functions are implemented correctly.
// Player instance
const player = new PlayerInventory();

// Example usage
// player.addMaterial({ name: "Iron Ore", weight: 2, quantity: 5, maxStack: 100 });
