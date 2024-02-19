function addMaterial(material) {
    const existingMaterial = player.materials.find(m => m.name === material.name);
    const addedWeight = player.currentWeight() + (material.weight * material.quantity);

    if (addedWeight <= player.maxWeight) {
        if (existingMaterial && (existingMaterial.quantity + material.quantity) <= existingMaterial.maxStack) {
            existingMaterial.quantity += material.quantity;
        } else if (!existingMaterial) {
            player.materials.push(material);
        }
        updateMaterialsDisplay();
    } else {
        console.log("Cannot acquire more materials due to weight limit.");
        // Add a log message to the user interface, if needed
    }
}
function updateMaterialsDisplay() {
    const materialsPanel = document.querySelector("#materialsPanel");
    materialsPanel.innerHTML = "<div class='bagTitle'><h4></h4></div>";

    player.materials.forEach((material, index) => {
        const materialElement = document.createElement("p");
        // Check if icon is defined and not empty, otherwise use fallback
        const iconSrc = material.icon && material.icon.trim() !== "" ? material.icon : "/assets/materials/loot_bag.png";
        materialElement.innerHTML = `<img src="${iconSrc}" alt="${material.name} Icon" style="width: 32px; height: 32px; margin-top: 0px; vertical-align: middle;"> <span class="${material.rarity}">${material.name} (${material.quantity})</span>`;
        // materialElement.innerHTML = `<span class="${material.rarity}">${material.name} (${material.quantity})</span>`;
        materialElement.classList.add("clickable-material");
        materialElement.addEventListener("click", () => openMaterialModal(material, index));
        materialsPanel.appendChild(materialElement);
    });
}

function openMaterialModal(material, index) {
    const modal = document.querySelector("#materialModal");
    document.querySelector("#modalMaterialName").textContent = `${material.name} (${material.quantity})`;
    const actionsContainer = document.querySelector("#materialActions");
    actionsContainer.innerHTML = ""; // Clear previous actions

    // Conditionally add Sell or Use option
    if (material.sellValue && material.quantity > 1) {
        const sellInput = document.createElement("input");
        sellInput.type = "number";
        sellInput.min = "1";
        sellInput.max = material.quantity.toString();
        sellInput.value = "1"; // Default to 1
        sellInput.id = "sellQuantityInput";
        actionsContainer.appendChild(sellInput);

        const sellButton = document.createElement("button");
        sellButton.textContent = "Sell";
        sellButton.onclick = () => sellMaterial(index, parseInt(sellInput.value));
        actionsContainer.appendChild(sellButton);
    } else if (material.sellValue) {
        const sellButton = document.createElement("button");
        sellButton.textContent = "Sell";
        sellButton.onclick = () => sellMaterial(index, 1);
        actionsContainer.appendChild(sellButton);
    }


    // Always add Drop option
    const dropButton = document.createElement("button");
    dropButton.textContent = "Drop";
    dropButton.addEventListener("click", () => dropMaterial(index));
    actionsContainer.appendChild(dropButton);

    modal.style.display = "flex"; // Show the modal
    // document.querySelector(".close").addEventListener("click", () => modal.style.display = "none");
}

function sellMaterial(index, quantityToSell) {
    const material = player.materials[index];
    // Use the quantityToSell from the input box, ensure it doesn't exceed available quantity
    quantityToSell = Math.min(quantityToSell, material.quantity);
    
    if (quantityToSell > 0) {
        player.gold += quantityToSell * material.sellValue;
        material.quantity -= quantityToSell;
        if (material.quantity === 0) {
            player.materials.splice(index, 1); // Remove material if quantity is 0
        }
        updateMaterialsDisplay();
        playerLoadStats(); // Assuming this updates gold display
    }
    closeMaterial();
}

function useMaterial(index) {
    // Implementation depends on how 'use' affects the game
    closeMaterial();
}

function dropMaterial(index) {
    const material = player.materials[index];
    let quantityToDrop = parseInt(prompt("Enter quantity to drop:"));
    if (quantityToDrop > 0 && quantityToDrop <= material.quantity) {
        material.quantity -= quantityToDrop;
        if (material.quantity === 0) {
            player.materials.splice(index, 1);
        }
        updateMaterialsDisplay();
    }
    closeMaterial();
}

// Closes inventory
const closeMaterial = () => {
    sfxDecline.play();

    let openMat = document.querySelector('#materialModal');
    let dimDungeon = document.querySelector('#dungeon-main');
    openMat.style.display = "none";
    dimDungeon.style.filter = "brightness(100%)";
    materialOpen = false;
    if (!dungeon.status.paused) {
        dungeon.status.exploring = true;
    }
}