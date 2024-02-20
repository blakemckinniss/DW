const targetNode = document.getElementById('dungeonLog');
const callback = function(mutationsList, observer) {
    for(const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            const pElements = targetNode.querySelectorAll('p');
            if (pElements.length > 2) {
                const oldestP = pElements[0];
                
                oldestP.addEventListener('transitionend', function() {
                    this.remove(); // Remove the element after transition ends
                    if (dungeon.backlog.length > 0) {
                        dungeon.backlog.shift();
                    }
                }, { once: true }); // Ensures the listener is removed after execution
                oldestP.classList.add('fade-out');
            }
        }
    }
};

const observer = new MutationObserver(callback);
const config = { childList: true };
observer.observe(targetNode, config);
function sleep(milliseconds) {
    const start = new Date().getTime();
    while (new Date().getTime() - start < milliseconds) {
        // Busy wait does nothing while blocking execution
    }
}

document.ondblclick = function (e) {
    e.preventDefault();
}



const nFormatter = (num) => {
    let lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "B" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" }
    ];
    let rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    let item = lookup.slice().reverse().find(function (item) {
        return num >= item.value;
    });
    return item ? (num / item.value).toFixed(2).replace(rx, "$1") + item.symbol : "0";
}

const querySelector = (selector) => document.querySelector(selector);

const randomizeNum = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.round(Math.floor(Math.random() * (max - min + 1)) + min);
}

const randomizeDecimal = (min, max) => {
    return Math.random() * (max - min) + min;
}

const toggleDisplay = (selector, displayStyle) => {
    const element = querySelector(selector);
    element.style.display = displayStyle;
};

const updateBrightness = (selector, brightness) => {
    const element = querySelector(selector);
    element.style.filter = `brightness(${brightness})`;
};


const importData = (importedData) => {
    try {
        const playerImport = JSON.parse(atob(importedData));
        if (playerImport.inventory !== undefined) {
            showImportModal("Are you sure you want to import this data? This will erase the current data and reset your dungeon progress.", () => {
                sfxConfirm.play();
                player = playerImport;
                saveData();
                resetUI();
                progressReset();
            }, () => {
                sfxDecline.play();
                confirmationModalElement.style.display = "none";
                defaultModalElement.style.display = "flex";
            });
        } else {
            sfxDeny.play();
        }
    } catch (err) {
        console.error("Failed to import data:", err);
        sfxDeny.play();
    }
}

const exportData = () => {
    const exportedData = btoa(JSON.stringify(player));
    return exportedData;
}

const showImportModal = (message, onConfirm, onCancel) => {
    sfxOpen.play();
    defaultModalElement.style.display = "none";
    confirmationModalElement.style.display = "flex";
    confirmationModalElement.innerHTML = `
        <div class="content">
            <p>${message}</p>
            <div class="button-container">
                <button id="import-btn">Import</button>
                <button id="cancel-btn">Cancel</button>
            </div>
        </div>`;
    document.querySelector("#import-btn").addEventListener("click", onConfirm);
    document.querySelector("#cancel-btn").addEventListener("click", onCancel);
}

const allocationPopup = () => {
    let allocation = {
        hp: 5,
        atk: 5,
        def: 5,
        atkSpd: 5
    };
    let stats = {};
    const updateStats = () => {
        Object.keys(allocation).forEach(stat => {
            const { multiplier } = statConfig[stat];
            stats[stat] = multiplier(allocation[stat]);
        });
    };
    updateStats();
    let points = 20;
    const loadContent = () => {
        const statRows = Object.entries(allocation).map(([key, value]) => `
            <div class="row">
                <p><i class="icon-${key}"></i><span id="${key}Display">${key.toUpperCase()}: ${stats[key]}</span></p>
                <div class="row">
                    <button id="${key}Min">-</button>
                    <span id="${key}Allo">${value}</span>
                    <button id="${key}Add">+</button>
                </div>
            </div>
        `).join('');

        defaultModalElement.innerHTML = `
        <div class="content" id="allocate-stats">
            <div class="content-head">
                <h3>Allocate Stats</h3>
                <p id="allocate-close"><i class="fa fa-xmark"></i></p>
            </div>
            ${statRows}
            <div class="row">
                <p id="alloPts">Stat Points: ${points}</p>
                <button id="allocate-reset">Reset</button>
            </div>
            <div class="row">
                <p>Passive</p>
                <select id="select-skill">...</select>
            </div>
            <div class="row primary-panel pad">
                <p id="skill-desc">...</p>
            </div>
            <button id="allocate-confirm">Confirm</button>
        </div>`;
    };

    defaultModalElement.style.display = "flex";
    document.querySelector("#title-screen").style.filter = "brightness(50%)";
    loadContent();

    const formatStatName = (stat) =>
        stat.replace(/([A-Z])/g, ' $1').trim().replace(/ /g, '.').toUpperCase();
    const updateUI = (stat, points, allocation, stats, rx) => {
        document.querySelector(`#${stat}Display`).innerHTML =
            `${formatStatName(stat)}: ${stats[stat].toFixed(2).replace(rx, "$1")}`;
        document.querySelector(`#${stat}Allo`).innerHTML = allocation[stat];
        document.querySelector(`#alloPts`).innerHTML = `Stat Points: ${points}`;
    };

    const handleStatButtons = (e) => {
        let rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        const action = e.includes("Add") ? "Add" : "Min";
        let stat = e.split(action)[0];
        const updateStat = (modifier) => {
            allocation[stat] += modifier;
            points -= modifier;
            sfxConfirm.play();
            updateStats();
            updateUI(stat, points, allocation, stats, rx);
        };

        if (action === "Add" && points > 0) {
            updateStat(1);
        } else if (action === "Min" && allocation[stat] > 5) {
            updateStat(-1);
        } else {
            sfxDeny.play();
        }
    };

    document.querySelector("#statButtonsContainer").addEventListener("click", function (event) {
        if (event.target.id && event.target.id.match(/(hp|atk|def|atkSpd)(Add|Min)/)) {
            handleStatButtons(event.target.id);
        }
    });
    
    let selectSkill = document.querySelector("#select-skill");
    let skillDesc = document.querySelector("#skill-desc");
    
    selectSkill.addEventListener('change', function () {
        skillDesc.innerHTML = skillDescriptions[selectSkill.value] || "Default description for unknown skills.";
        sfxConfirm.play();
    });
    
    let confirmButton = document.querySelector("#allocate-confirm");
    confirmButton.addEventListener('click', function () {
        player.baseStats = {
            hp: stats.hp,
            atk: stats.atk,
            def: stats.def,
            pen: 0,
            atkSpd: stats.atkSpd,
            vamp: 0,
            critRate: 0,
            critDmg: 50
        };
    
        objectValidation();
        player.skills.push(selectSkill.value);
        if (skillEffects[selectSkill.value]) {
            skillEffects[selectSkill.value](player);
        }
    
        player.allocated = true;
        enterDungeon();
        player.stats.hp = player.stats.hpMax;
        playerLoadStats();
        defaultModalElement.style.display = "none";
        document.querySelector("#title-screen").style.filter = "brightness(100%)";
    });
}

const playSoundEffect = (type) => {
    const soundEffects = {
        open: () => sfxOpen.play(),
        deny: () => sfxDeny.play(),
        equip: () => sfxEquip.play(),
        unequip: () => sfxUnequip.play(),
        sell: () => sfxSell.play(),
        decline: () => sfxDecline.play(),
    };
    if (soundEffects[type]) soundEffects[type]();
};

function battleRoutine(){
    hpValidation();
    playerLoadStats();
    enemyLoadStats();
}

function triggerAnimation(element, animationClass, duration) {
    element.classList.add(animationClass);
    setTimeout(() => element.classList.remove(animationClass), duration);
}

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function toggleExploring(dungeon) {
    if (dungeon.status.event && dungeon.status.exploring) {
        dungeon.status.event = false;
    }
    dungeon.status.exploring = true;
}

function handleModalButtonClick(buttonId) {
    if (buttonId === 'unequip-confirm') {
        sfxUnequip.play();
        unequipAll();
    } else {
        sfxDecline.play();
    }
    continueExploring();
    closeModal();
}
function closeModal() {
    defaultModalElement.style.display = "none";
    defaultModalElement.innerHTML = "";
    toggleInventoryBrightness(100);
}
function updateModalContent(htmlContent) {
    menuModalElement.innerHTML = htmlContent;
    menuModalElement.style.display = "flex";
}

function formatTime(seconds) {
    return new Date(seconds * 1000).toISOString().slice(11, 19);
}

function toggleInventoryBrightness(brightness) {
    let dimTarget = document.querySelector('#inventory');
    dimTarget.style.filter = `brightness(${brightness}%)`;
}

function showModal() {
    defaultModalElement.style.display = "flex";
    defaultModalElement.innerHTML = `
        <div class="content">
            <p>Unequip all your items?</p>
            <div class="button-container">
                <button id="unequip-confirm">Unequip</button>
                <button id="unequip-cancel">Cancel</button>
            </div>
        </div>`;
}

function showExportImport() {
    sfxOpen.play();
    const exportedData = exportData();
    const exportImportHtml = `
  <div class="content" id="ei-tab">
    <div class="content-head">
      <h3>Export/Import Data</h3>
      <p id="ei-close"><i class="fa fa-xmark"></i></p>
    </div>
    <h4>Export Data</h4>
    <textarea id="export-input" readonly>${exportedData}</textarea>
    <button id="copy-export">Copy</button>
    <h4>Import Data</h4>
    <input type="text" id="import-input">
    <button id="data-import">Import</button>
  </div>`;
    updateModalContent(exportImportHtml);
    document.querySelector('#ei-close').addEventListener('click', () => {
        sfxDecline.play();
        openMenu();
    });

    document.querySelector('#copy-export').addEventListener('click', copyToClipboard);
    document.querySelector('#data-import').addEventListener('click', importDataFromInput);

    function copyToClipboard() {
        const exportInput = document.querySelector('#export-input');
        exportInput.select();
        document.execCommand('copy');
        sfxConfirm.play();
    }

    function importDataFromInput() {
        const importInputValue = document.querySelector('#import-input').value;
        importData(importInputValue);
        sfxConfirm.play();
        openMenu();
    }
}

/**
 * Binds a property of an object to the innerHTML of an HTML element,
 * updating the element whenever the property changes.
 * @param {Object} obj - The object containing the property to monitor.
 * @param {string} propName - The name of the property to monitor.
 * @param {string} elementId - The ID of the HTML element to update.
 */
function bindPropertyToElement(obj, propName, elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found:', elementId);
      return;
    }
  
    const handler = {
      set(target, property, value) {
        if (property === propName) {
          target[property] = value;
          element.innerHTML = value; // Update the HTML element
          return true; // Indicate success
        }
        return false; // Indicate failure for other properties
      }
    };
  
    const proxy = new Proxy(obj, handler);
  
    // Initial update to ensure the element reflects the current property value
    element.innerHTML = obj[propName];
  
    // Return the proxy to allow further interaction with the original object
    return proxy;
  }
  
  // Example usage
//   const data = { myVariable: 0 };
//   const proxyData = bindPropertyToElement(data, 'myVariable', 'myElementId');
  
  // Now, whenever you update `proxyData.myVariable`, the innerHTML of the element
  // with ID 'myElementId' will be automatically updated.
//   setInterval(() => {
//     proxyData.myVariable++; // This will update the HTML element's content
//   }, 1000);