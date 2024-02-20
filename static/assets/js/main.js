window.addEventListener("load", function () {
    player === null ? createPlayer() : titleScreen.style.display = "flex";
    function createPlayer() {
        const player = {
            name: PLAYERNAME,
            lvl: 1,
            stats: { ...BASE_STATS },
            equippedStats: {
                hp: 0,
                atk: 0,
                def: 0,
                pen: 0,
                atkSpd: 0,
                vamp: 0,
                critRate: 0,
                critDmg: 0,
                hpPct: 0,
                atkPct: 0,
                defPct: 0,
                penPct: 0,
            },
            bonusStats: { ...BASE_STATS, hp: 0, atk: 0, def: 0 },
            exp: { ...EXP_DEFAULTS },
            inventory: {
                consumables: [],
                equipment: []
            },
            equipped: [],
            gold: 0,
            playtime: 0,
            kills: 0,
            deaths: 0,
            inCombat: false,
            luck: 1,
            strength: 100,
            materials: [],
            vixens: [],
            buffs: [],
            banes: [],
            energy: 100,
            maxEnergy: 100,
            energyCost: 1,
            energyRegenRate: 1,
            currentWeight: function () {
                return this.materials.reduce((total, material) => total + (material.weight * material.quantity), 0);
            }
        };
        player.maxWeight = player.strength * 10;
        player.stats.hp = player.stats.hpMax;
        calculateStats();
        saveData();
        document.querySelector("#character-creation").style.display = "none";
        runLoad("title-screen", "flex");
        return player;
    }

    function openMenu() {
        closeInventory();
        dungeon.status.exploring = false;
        dimDungeon.style.filter = "brightness(50%)";
        const menuHtml = `
    <div class="content">
      <div class="content-head">
        <h3>Menu</h3>
        <p id="close-menu"><i class="fa fa-xmark"></i></p>
      </div>
      <button id="player-menu">${player.name}</button>
      <button id="stats">Current Run</button>
      <button id="volume-btn">Volume Settings</button>
      <button id="export-import">Export/Import Data</button>
      <button id="quit-run">Abandon</button>
    </div>`;
        updateModalContent(menuHtml);
        attachMenuEventListeners();
    }

    function closeMenu() {
        sfxDecline.play();
        continueExploring();
        menuModalElement.style.display = "none";
        dimDungeon.style.filter = "brightness(100%)";
    }

    function showPlayerStats() {
        sfxOpen.play();
        const playTime = formatTime(player.playtime);
        const playerStatsHtml = `
      <div class="content" id="profile-tab">
        <div class="content-head">
          <h3>Statistics</h3>
          <p id="profile-close"><i class="fa fa-xmark"></i></p>
        </div>
        <p>${player.name} Lv.${player.lvl}</p>
        <p>Kills: ${nFormatter(player.kills)}</p>
        <p>Deaths: ${nFormatter(player.deaths)}</p>
        <p>Playtime: ${playTime}</p>
      </div>`;
        updateModalContent(playerStatsHtml);
        document.querySelector('#profile-close').addEventListener('click', () => {
            sfxDecline.play();
            openMenu();
        });
    }

    function showCurrentRun() {
        sfxOpen.play();
        const runTime = formatTime(dungeon.statistics.runtime);
        const runStatsHtml = `
      <div class="content" id="run-tab">
        <div class="content-head">
          <h3>Current Run</h3>
          <p id="run-close"><i class="fa fa-xmark"></i></p>
        </div>
        <p>${player.name} Lv.${player.lvl} (${player.skills.join(', ')})</p>
        <p>Blessing Lvl.${player.blessing}</p>
        <p>Curse Lvl.${Math.round((dungeon.settings.enemyScaling - 1) * 10)}</p>
        <p>Kills: ${nFormatter(dungeon.statistics.kills)}</p>
        <p>Runtime: ${runTime}</p>
      </div>`;
        updateModalContent(runStatsHtml);
        document.querySelector('#run-close').addEventListener('click', () => {
            sfxDecline.play();
            openMenu();
        });
    }

    function showVolumeSettings() {
        sfxOpen.play();
        const master = volume.master * 100;
        const bgm = volume.bgm * 100;
        const sfx = volume.sfx * 100;
        const volumeSettingsHtml = `
      <div class="content" id="volume-tab">
        <div class="content-head">
          <h3>Volume</h3>
          <p id="volume-close"><i class="fa fa-xmark"></i></p>
        </div>
        <label for="master-volume">Master (${master.toFixed(0)}%)</label>
        <input type="range" id="master-volume" min="0" max="100" value="${master}">
        <label for="bgm-volume">BGM (${bgm.toFixed(0)}%)</label>
        <input type="range" id="bgm-volume" min="0" max="100" value="${bgm}">
        <label for="sfx-volume">SFX (${sfx.toFixed(0)}%)</label>
        <input type="range" id="sfx-volume" min="0" max="100" value="${sfx}">
        <button id="apply-volume">Apply</button>
      </div>`;

        updateModalContent(volumeSettingsHtml);
        document.querySelector('#volume-close').addEventListener('click', () => {
            sfxDecline.play();
            openMenu();
        });
        document.querySelector('#apply-volume').addEventListener('click', applyVolumeSettings);
        function applyVolumeSettings() {
            const masterVolume = document.querySelector('#master-volume').value / 100;
            const bgmVolume = document.querySelector('#bgm-volume').value / 100;
            const sfxVolume = document.querySelector('#sfx-volume').value / 100;
            setVolume(masterVolume, bgmVolume, sfxVolume);
            sfxConfirm.play();
        }
    }

    function quitRun() {
        sfxOpen.play();
        updateModalContent(confirmQuitHtml);
        document.querySelector('#quit-close').addEventListener('click', () => {
            sfxDecline.play();
            openMenu();
        });
        document.querySelector('#confirm-quit').addEventListener('click', () => {
            confirmAbandonment();
        });
        document.querySelector('#cancel-quit').addEventListener('click', () => {
            sfxDecline.play();
            openMenu();
        });
    }

    function confirmAbandonment() {
        sfxConfirm.play();
        bgmDungeon.stop();
        dimDungeon.style.filter = "brightness(100%)";
        clearInterval(dungeonTimer);
        clearInterval(playTimer);
        progressReset();
        runLoad("title-screen", "flex");
        menuModalElement.style.display = "none";
    }

    function attachMenuEventListeners() {
        const eventMappings = [
            { selector: '#close-menu', handler: closeMenu },
            { selector: '#player-menu', handler: showPlayerStats },
            { selector: '#stats', handler: showCurrentRun },
            { selector: '#volume-btn', handler: showVolumeSettings },
            { selector: '#export-import', handler: showExportImport },
            { selector: '#quit-run', handler: quitRun }
        ];
    
        eventMappings.forEach(mapping => {
            const element = document.querySelector(mapping.selector);
            if (element) { // This check ensures the element exists before trying to attach an event listener
                element.addEventListener('click', mapping.handler);
            }
        });
    }

    titleScreen.addEventListener("click", function () {
        player = JSON.parse(localStorage.getItem("playerData")) || {};
        player.allocated ? enterDungeon() : allocationPopup();
        loadBuffsBanesFromLocalStorage();
    });

    unequipAllElement.addEventListener("click", function () {
        sfxOpen.play();
        dungeon.status.exploring = false;
        toggleInventoryBrightness(50);
        showModal();
    });

    defaultModalElement.addEventListener('click', function (e) {
        if (e.target.id === 'unequip-confirm' || e.target.id === 'unequip-cancel') {
            handleModalButtonClick(e.target.id);
        }
    });

    menuBtnElement.addEventListener("click", openMenu);
    menuBtnElement.addEventListener("click", function () {
        closeInventory();
        dungeon.status.exploring = false;
        let dimDungeon = document.querySelector('#dungeon-main');
        dimDungeon.style.filter = "brightness(50%)";
        menuModalElement.style.display = "flex";
        menuModalElement.innerHTML = `
            <div class="content">
                <div class="content-head">
                    <h3>Menu</h3>
                    <p id="close-menu"><i class="fa fa-xmark"></i></p>
                </div>
                <button id="player-menu">${player.name}</button>
                <button id="stats">Current Run</button>
                <button id="volume-btn">Volume Settings</button>
                <button id="export-import">Export/Import Data</button>
                <button id="quit-run">Abandon</button>
            </div>`;
        let close = document.querySelector('#close-menu');
        let playerMenu = document.querySelector('#player-menu');
        let runMenu = document.querySelector('#stats');
        let quitRun = document.querySelector('#quit-run');
        let exportImport = document.querySelector('#export-import');
        let volumeSettings = document.querySelector('#volume-btn');
        playerMenu.onclick = function () {
            sfxOpen.play();
            let playTime = new Date(player.playtime * 1000).toISOString().slice(11, 19);
            menuModalElement.style.display = "none";
            defaultModalElement.style.display = "flex";
            defaultModalElement.innerHTML = `
            <div class="content" id="profile-tab">
                <div class="content-head">
                    <h3>Statistics</h3>
                    <p id="profile-close"><i class="fa fa-xmark"></i></p>
                </div>
                <p>${player.name} Lv.${player.lvl}</p>
                <p>Kills: ${nFormatter(player.kills)}</p>
                <p>Deaths: ${nFormatter(player.deaths)}</p>
                <p>Playtime: ${playTime}</p>
            </div>`;
            let profileTab = document.querySelector('#profile-tab');
            profileTab.style.width = "15rem";
            let profileClose = document.querySelector('#profile-close');
            profileClose.onclick = function () {
                sfxDecline.play();
                defaultModalElement.style.display = "none";
                defaultModalElement.innerHTML = "";
                menuModalElement.style.display = "flex";
            };
        };
        runMenu.onclick = function () {
            sfxOpen.play();
            let runTime = new Date(dungeon.statistics.runtime * 1000).toISOString().slice(11, 19);
            menuModalElement.style.display = "none";
            defaultModalElement.style.display = "flex";
            defaultModalElement.innerHTML = `
            <div class="content" id="run-tab">
                <div class="content-head">
                    <h3>Current Run</h3>
                    <p id="run-close"><i class="fa fa-xmark"></i></p>
                </div>
                <p>${player.name} Lv.${player.lvl} (${player.skills})</p>
                <p>Blessing Lvl.${player.blessing}</p>
                <p>Curse Lvl.${Math.round((dungeon.settings.enemyScaling - 1) * 10)}</p>
                <p>Kills: ${nFormatter(dungeon.statistics.kills)}</p>
                <p>Runtime: ${runTime}</p>
            </div>`;
            let runTab = document.querySelector('#run-tab');
            runTab.style.width = "15rem";
            let runClose = document.querySelector('#run-close');
            runClose.onclick = function () {
                sfxDecline.play();
                defaultModalElement.style.display = "none";
                defaultModalElement.innerHTML = "";
                menuModalElement.style.display = "flex";
            };
        };
        quitRun.onclick = function () {
            sfxOpen.play();
            menuModalElement.style.display = "none";
            defaultModalElement.style.display = "flex";
            defaultModalElement.innerHTML = defaultModalElementHtml;
            let quit = document.querySelector('#quit-run');
            let cancel = document.querySelector('#cancel-quit');
            quit.onclick = function () {
                sfxConfirm.play();
                bgmDungeon.stop();
                let dimDungeon = document.querySelector('#dungeon-main');
                dimDungeon.style.filter = "brightness(100%)";
                dimDungeon.style.display = "none";
                menuModalElement.style.display = "none";
                menuModalElement.innerHTML = "";
                defaultModalElement.style.display = "none";
                defaultModalElement.innerHTML = "";
                runLoad("title-screen", "flex");
                clearInterval(dungeonTimer);
                clearInterval(playTimer);
                progressReset();
            };
            cancel.onclick = function () {
                sfxDecline.play();
                defaultModalElement.style.display = "none";
                defaultModalElement.innerHTML = "";
                menuModalElement.style.display = "flex";
            };
        };
        volumeSettings.onclick = function () {
            sfxOpen.play();
            let master = volume.master * 100;
            let bgm = (volume.bgm * 100) * 2;
            let sfx = volume.sfx * 100;
            menuModalElement.style.display = "none";
            defaultModalElement.style.display = "flex";
            defaultModalElement.innerHTML = `
            <div class="content" id="volume-tab">
                <div class="content-head">
                    <h3>Volume</h3>
                    <p id="volume-close"><i class="fa fa-xmark"></i></p>
                </div>
                <label id="master-label" for="master-volume">Master (${master}%)</label>
                <input type="range" id="master-volume" min="0" max="100" value="${master}">
                <label id="bgm-label" for="bgm-volume">BGM (${bgm}%)</label>
                <input type="range" id="bgm-volume" min="0" max="100" value="${bgm}">
                <label id="sfx-label" for="sfx-volume">SFX (${sfx}%)</label>
                <input type="range" id="sfx-volume" min="0" max="100" value="${sfx}">
                <button id="apply-volume">Apply</button>
            </div>`;
            let masterVol = document.querySelector('#master-volume');
            let bgmVol = document.querySelector('#bgm-volume');
            let sfxVol = document.querySelector('#sfx-volume');
            let applyVol = document.querySelector('#apply-volume');
            let volumeTab = document.querySelector('#volume-tab');
            volumeTab.style.width = "15rem";
            let volumeClose = document.querySelector('#volume-close');
            volumeClose.onclick = function () {
                sfxDecline.play();
                defaultModalElement.style.display = "none";
                defaultModalElement.innerHTML = "";
                menuModalElement.style.display = "flex";
            };
            masterVol.oninput = function () {
                master = this.value;
                document.querySelector('#master-label').innerHTML = `Master (${master}%)`;
            };
            bgmVol.oninput = function () {
                bgm = this.value;
                document.querySelector('#bgm-label').innerHTML = `BGM (${bgm}%)`;
            };
            sfxVol.oninput = function () {
                sfx = this.value;
                document.querySelector('#sfx-label').innerHTML = `SFX (${sfx}%)`;
            };
            applyVol.onclick = function () {
                volume.master = master / 100;
                volume.bgm = (bgm / 100) / 2;
                volume.sfx = sfx / 100;
                bgmDungeon.stop();
                setVolume();
                bgmDungeon.play();
                saveData();
            };
        };
        exportImport.onclick = function () {
            sfxOpen.play();
            let exportedData = exportData();
            menuModalElement.style.display = "none";
            defaultModalElement.style.display = "flex";
            defaultModalElement.innerHTML = `
            <div class="content" id="ei-tab">
                <div class="content-head">
                    <h3>Export/Import Data</h3>
                    <p id="ei-close"><i class="fa fa-xmark"></i></p>
                </div>
                <h4>Export Data</h4>
                <input type="text" id="export-input" autocomplete="off" value="${exportedData}" readonly>
                <button id="copy-export">Copy</button>
                <h4>Import Data</h4>
                <input type="text" id="import-input" autocomplete="off">
                <button id="data-import">Import</button>
            </div>`;
            let eiTab = document.querySelector('#ei-tab');
            eiTab.style.width = "15rem";
            let eiClose = document.querySelector('#ei-close');
            let copyExport = document.querySelector('#copy-export')
            let dataImport = document.querySelector('#data-import');
            let importInput = document.querySelector('#import-input');
            copyExport.onclick = function () {
                sfxConfirm.play();
                let copyText = document.querySelector('#export-input');
                copyText.select();
                copyText.setSelectionRange(0, 99999);
                navigator.clipboard.writeText(copyText.value);
                copyExport.innerHTML = "Copied!";
            }
            dataImport.onclick = function () {
                importData(importInput.value);
            };
            eiClose.onclick = function () {
                sfxDecline.play();
                defaultModalElement.style.display = "none";
                defaultModalElement.innerHTML = "";
                menuModalElement.style.display = "flex";
            };
        };
        close.onclick = function () {
            sfxDecline.play();
            continueExploring();
            menuModalElement.style.display = "none";
            menuModalElement.innerHTML = "";
            dimDungeon.style.filter = "brightness(100%)";
        };
    });
});

const runLoad = (id, display) => {
    let loader = document.querySelector("#loading");
    loader.style.display = "flex";
    setTimeout(async () => {
        loader.style.display = "none";
        document.querySelector(`#${id}`).style.display = `${display}`;
        document.querySelector(".vixens-wrapper").style.display = "flex";
    }, 1000);
}

const enterDungeon = () => {
    sfxConfirm.play();
    document.querySelector("#title-screen").style.display = "none";
    runLoad("dungeon-main", "flex");
    if (player.inCombat) {
        enemy = JSON.parse(localStorage.getItem("enemyData"));
        showCombatInfo()
        console.log("You encountered: ", enemy.name);
        startCombat(bgmBattleMain);
    } else {

    }
    if (player.stats.hp == 0) {
        progressReset();
    }
    initialDungeonLoad();
    playerLoadStats();
}

const saveData = () => {
    const playerData = JSON.stringify(player);
    const dungeonData = JSON.stringify(dungeon);
    const enemyData = JSON.stringify(enemy);
    const volumeData = JSON.stringify(volume);
    localStorage.setItem("playerData", playerData);
    localStorage.setItem("dungeonData", dungeonData);
    localStorage.setItem("enemyData", enemyData);
    localStorage.setItem("volumeData", volumeData);
}

const calculateStat = (base, bonus, equipped) => {
    return Math.round(base + base * (bonus / 100) + equipped);
};

const calculateStats = () => {
    const { baseStats, bonusStats, equippedStats } = player;
    player.stats.hpMax = calculateStat(baseStats.hp, bonusStats.hp, equippedStats.hp);
    player.stats.atk = calculateStat(baseStats.atk, bonusStats.atk, equippedStats.atk);
    player.stats.def = calculateStat(baseStats.def, bonusStats.def, equippedStats.def);
    player.stats.vamp = baseStats.vamp + bonusStats.vamp + equippedStats.vamp;
    player.stats.critRate = baseStats.critRate + bonusStats.critRate + equippedStats.critRate;
    player.stats.critDmg = baseStats.critDmg + bonusStats.critDmg + equippedStats.critDmg;
    const baseAtkSpd = baseStats.atkSpd * (1 + bonusStats.atkSpd / 100);
    const totalAtkSpd = baseAtkSpd + baseAtkSpd * (equippedStats.atkSpd / 100) + equippedStats.atkSpd;
    player.stats.atkSpd = Math.min(2.5, totalAtkSpd);
};

const resetPlayerStats = () => ({
    hp: player.stats.hpMax,
    atk: player.bonusStats.atk * 0.9,
    def: player.bonusStats.def * 0.9,
    atkSpd: player.bonusStats.atkSpd * 0.9,
    vamp: player.bonusStats.vamp * 0.9,
    critRate: player.bonusStats.critRate * 0.9,
    critDmg: player.bonusStats.critDmg * 0.9,
});

const resetPlayer = () => {
    player.stats.hp = player.stats.hpMax;
    player.lvl = Math.max(player.lvl - 5, 1);
    player.blessing = 1;
    Object.assign(player.bonusStats, resetPlayerStats());
    player.skills = [];
    player.inCombat = false;
    player.luck = 1;
    player.strength = 100;
    player.materials = [];
    player.vixens = [];
    player.energy = 10;
    player.maxEnergy = 100;
    player.energyCost = 1;
    player.energyRegenRate = 1;
    player.currentWeight = () => player.materials.reduce((total, material) => total + (material.weight * material.quantity), 0);
    player.buffs = [];
    player.banes = [];
    player.logEntries = [];
};

const resetDungeon = () => {
    dungeon.statistics.kills = 0;
    dungeon.status = { exploring: false, paused: true, event: false };
    dungeon.backlog.length = 0;
    dungeon.action = 0;
    dungeon.statistics.runtime = 0;
};

const progressReset = () => {
    resetPlayer();
    resetDungeon();
    combatBacklog.length = 0;
    saveData();
    location.reload();
};

const resetUI = () => {
    bgmDungeon.stop();
    document.querySelector('#dungeon-main').style.filter = "brightness(100%)";
    menuModalElement.style.display = "none";
    confirmationModalElement.style.display = "none";
    defaultModalElement.style.display = "none";
    [menuModalElement, confirmationModalElement, defaultModalElement].forEach(el => el.innerHTML = "");
    runLoad("title-screen", "flex");
    clearInterval(dungeonTimer);
    clearInterval(playTimer);
}

const objectValidation = () => {
    if (player.skills == undefined) {
        player.skills = [];
    }
    if (player.tempStats == undefined) {
        player.tempStats = {};
        player.tempStats.atk = 0;
        player.tempStats.atkSpd = 0;
    }
    saveData();
}