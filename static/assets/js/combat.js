const combatPanel = document.querySelector("#combatPanel")
let enemyDead = false;
let playerDead = false;

function handlePlayerDeath() {
    player.stats.hp = 0;
    playerDead = true;
    player.deaths++;
    addCombatLog(`You died!`);
    setupBattleButtonListenerForDeath();
    endCombat();
}

function handleEnemyDeath() {
    enemy.stats.hp = 0;
    enemyDead = true;
    player.kills++;
    dungeon.statistics.kills++;
    logEnemyDeathAndRewards();
    player.stats.hp += Math.round((player.stats.hpMax * 20) / 100);
    playerLoadStats();
    setupBattleButtonListenerForWin();
    endCombat();
}

function setupBattleButtonListenerForDeath() {
    const battleButton = document.querySelector("#battleButton");
    battleButton.addEventListener("click", battleButtonListenerForDeath);
}

function setupBattleButtonListenerForWin() {
    const battleButton = document.querySelector("#battleButton");
    battleButton.addEventListener("click", battleButtonListenerForWin);
}

function logEnemyDeathAndRewards() {
    addCombatLog(`${enemy.name} died! (${new Date(combatSeconds * 1000).toISOString().substring(14, 19)})`);
    addCombatLog(`You earned ${nFormatter(enemy.rewards.exp)} exp.`);
    addCombatLog(`${enemy.name} dropped <i class="fas fa-coins" style="color: #FFD700;"></i>${nFormatter(enemy.rewards.gold)} gold.`);
    player.gold += enemy.rewards.gold;
    if (enemy.rewards.drop) {
        createEquipmentPrint("combat");
    }
}

const hpValidation = () => {
    if (player.stats.hp < 1) {
        handlePlayerDeath();
    } else if (enemy.stats.hp < 1) {
        handleEnemyDeath();
    }
};

function battleButtonListenerForDeath() {
    sfxConfirm.play();
    playerDead = false;
    let dimDungeon = document.querySelector('#dungeon-main');
    dimDungeon.style.filter = "brightness(100%)";
    dimDungeon.style.display = "none";
    combatPanel.style.display = "none";
    runLoad("title-screen", "flex");
    clearInterval(dungeonTimer);
    clearInterval(playTimer);
    progressReset();
}

function battleButtonListenerForWin() {
    sfxConfirm.play();
    let dimDungeon = document.querySelector('#dungeon-main');
    dimDungeon.style.filter = "brightness(100%)";
    bgmDungeon.play();
    dungeon.status.event = false;
    combatPanel.style.display = "none";
    enemyDead = false;
    combatBacklog.length = 0;
}

function calculateBaseDamage() {
    let damage = player.stats.atk * (player.stats.atk / (player.stats.atk + enemy.stats.def));
    let dmgRange = 0.9 + Math.random() * 0.2;
    damage *= dmgRange;
    let isCrit = Math.floor(Math.random() * 100) < player.stats.critRate;
    damage = isCrit ? Math.round(damage * (1 + (player.stats.critDmg / 100))) : Math.round(damage);
    return { damage, isCrit };
}

function applyAttackModifyingSkills(damage) {
    if (player.skills.includes("Rampager")) {
        player.baseStats.atk += 5;
        objectValidation();
        player.tempStats.atk += 5;
        saveData();
    }
    if (player.skills.includes("Blade Dance")) {
        player.baseStats.atkSpd += 0.01;
        objectValidation();
        player.tempStats.atkSpd += 0.01;
        saveData();
    }
    return damage;
}

function animateEnemySprite() {
    let enemySprite = document.querySelector("#enemy-sprite");
    enemySprite.classList.add("animation-shake");
    setTimeout(() => enemySprite.classList.remove("animation-shake"), 200);
}

function displayDamage(damage, isCrit, container) {
    const dmgNumber = document.createElement("p");
    dmgNumber.className = "dmg-numbers"; // More concise for single class
    dmgNumber.style.color = isCrit ? "gold" : "";
    dmgNumber.innerHTML = `${nFormatter(damage)}${isCrit ? "!" : ""}`; // Template literal for clarity
    container.appendChild(dmgNumber);
    setTimeout(() => container.removeChild(dmgNumber), 370);
}
function scheduleNextAttack() {
    if (player.inCombat) {
        setTimeout(playerAttack, 1000 / player.stats.atkSpd);
    }
}

const playerAttack = () => {
    if (!player.inCombat) return;
    sfxAttack.play();
    let crit = false;
    let dmgtype = "damage";
    let damage = player.stats.atk * (player.stats.atk / (player.stats.atk + enemy.stats.def));
    let dmgRange = 0.9 + Math.random() * 0.2;
    damage *= dmgRange;
    if (Math.floor(Math.random() * 100) < player.stats.critRate) {
        crit = true;
        dmgtype = "crit damage";
        damage = Math.round(damage * (1 + (player.stats.critDmg / 100)));
    } else {
        damage = Math.round(damage);
    }
    objectValidation();
    Object.keys(skillEffects).forEach(skill => {
        if (player.skills.includes(skill)) {
            const effect = skillEffects[skill];
            switch (effect.type) {
                case "percentageOfEnemyHp":
                    damage += Math.round((effect.value * enemy.stats.hp) / 100);
                    break;
                case "percentageOfPlayerHpMax":
                    damage += Math.round((effect.value * player.stats.hpMax) / 100);
                    break;
                case "percentageOfDamage":
                    damage += Math.round(damage * (effect.value / 100));
                    break;
                default:
                    console.error("Unknown skill effect type:", effect.type);
            }
        }
    });
    if (player.skills.includes("Rampager") || player.skills.includes("Blade Dance")) {
        objectValidation();
        saveData();
    }
    let lifesteal = Math.round(damage * (player.stats.vamp / 100));
    enemy.stats.hp -= damage;
    player.stats.hp += lifesteal;
    addCombatLog(`${player.name} dealt ` + nFormatter(damage) + ` ${dmgtype} to ${enemy.name}.`);
    battleRoutine()
    const enemySprite = document.querySelector("#enemy-sprite");
    const dmgContainer = document.querySelector("#dmg-container");
    triggerAnimation(enemySprite, "animation-shake", 200);
    displayDamage(damage, crit, dmgContainer);
    if (player.inCombat) {
        setTimeout(playerAttack, 1000 / player.stats.atkSpd);
    }
};

const enemyAttack = () => {
    if (!player.inCombat) return;
    sfxAttack.play();
    let baseDamage = enemy.stats.atk * (enemy.stats.atk / (enemy.stats.atk + player.stats.def));
    let dmgRangeMultiplier = 0.9 + Math.random() * 0.2;
    let isCrit = Math.random() < (enemy.stats.critRate / 100);
    let damageModifier = isCrit ? 1 + (enemy.stats.critDmg / 100) : 1;
    let damage = Math.round(baseDamage * dmgRangeMultiplier * damageModifier);
    if (player.skills.includes("Paladin's Heart")) {
        damage -= Math.round(damage * 0.25);
    }
    if (player.skills.includes("Aegis Thorns")) {
        enemy.stats.hp -= Math.round((15 * damage) / 100);
    }
    let lifesteal = Math.round(enemy.stats.atk * (enemy.stats.vamp / 100));
    player.stats.hp -= damage;
    objectValidation();
    enemy.stats.hp += lifesteal;
    addCombatLog(`${enemy.name} dealt ` + nFormatter(damage) + ` ${dmgtype} to ${player.name}.`);
    battleRoutine();
    let playerPanel = document.querySelector('#playerPanel');
    playerPanel.classList.add("animation-shake");
    setTimeout(() => playerPanel.classList.remove("animation-shake"), 200);
    if (player.inCombat) {
        setTimeout(enemyAttack, 1000 / enemy.stats.atkSpd);
    }
};

function calculateDamage(atk, atkBase, def) {
    let dmgRange = 0.9 + Math.random() * 0.2;
    return atk * (atkBase / (atkBase + def)) * dmgRange;
}

function applyDamageModifiers(damage, stats, targetStats, isEnemy = false) {
    if (!isEnemy) {
        
        if (player.skills.includes("Remnant Razor")) {
            damage += Math.round((8 * targetStats.hp) / 100);
        }
        if (player.skills.includes("Titan's Will")) {
            damage += Math.round((5 * stats.hpMax) / 100);
        }
        if (player.skills.includes("Devastator")) {
            damage *= 1.3;
        }
    } else {
        
        if (player.skills.includes("Paladin's Heart")) {
            damage *= 0.75;
        }
    }

    
    let crit = Math.floor(Math.random() * 100) < stats.critRate;
    damage = crit ? damage * (1 + (stats.critDmg / 100)) : damage;
    return Math.round(damage);
}

function updateCombatUI(attacker, defender, damage, attackerType) {
    
    console.log(`${attacker.name} dealt ${nFormatter(damage)} to ${defender.name}.`);
    
}

function scheduleNextAttack(attackerType) {
    
    let attackSpeed = attackerType === "player" ? player.stats.atkSpd : enemy.stats.atkSpd;
    setTimeout(() => {
        if (player.inCombat) {
            (attackerType === "player" ? playerAttack : enemyAttack)();
        }
    }, 1000 / attackSpeed);
}


function calculateEnemyBaseDamage() {
    let damage = enemy.stats.atk * (enemy.stats.atk / (enemy.stats.atk + player.stats.def));
    let dmgRange = 0.9 + Math.random() * 0.2;
    damage *= dmgRange;
    let isCrit = Math.floor(Math.random() * 100) < enemy.stats.critRate;
    damage = isCrit ? Math.round(damage * (1 + (enemy.stats.critDmg / 100))) : Math.round(damage);
    return { damage, isCrit };
}

function applyDefensiveSkillEffects(baseDamage) {
    let damage = baseDamage;
    if (player.skills.includes("Paladin's Heart")) {
        damage -= Math.round((25 * damage) / 100);
    }
    return damage;
}

function applyDamageAndLifesteal(damage) {
    player.stats.hp -= damage;
    objectValidation();
    if (player.skills.includes("Aegis Thorns")) {
        enemy.stats.hp -= Math.round((15 * damage) / 100);
    }
    let lifesteal = Math.round(enemy.stats.atk * (enemy.stats.vamp / 100));
    enemy.stats.hp += lifesteal;
    hpValidation();
    playerLoadStats();
    enemyLoadStats();
}

function logAndAnimateEnemyAttack(damage, isCrit) {
    addCombatLog(`${enemy.name} dealt ${nFormatter(damage)} ${isCrit ? "crit damage" : "damage"} to ${player.name}.`);
    let playerPanel = document.querySelector('#playerPanel');
    playerPanel.classList.add("animation-shake");
    setTimeout(() => playerPanel.classList.remove("animation-shake"), 200);
}

function scheduleNextEnemyAttack() {
    if (player.inCombat) {
        setTimeout(enemyAttack, 1000 / enemy.stats.atkSpd);
    }
}

const combatBacklog = [];
const addCombatLog = (message) => {
    combatBacklog.push(message);
    updateCombatLog();
}
const updateCombatLog = () => {
    let combatLogBox = document.getElementById("combatLogBox");
    for (let message of combatBacklog) {
        let logElement = document.createElement("p");
        logElement.innerHTML = message;
        combatLogBox.appendChild(logElement);
    }

    if (enemyDead) {
        let button = document.createElement("div");
        button.className = "decision-panel";
        button.innerHTML = `<button id="battleButton">Claim</button>`;
        combatLogBox.appendChild(button);
    }

    if (playerDead) {
        let button = document.createElement("div");
        button.className = "decision-panel";
        button.innerHTML = `<button id="battleButton">Back to Menu</button>`;
        combatLogBox.appendChild(button);
    }
    combatLogBox.scrollTop = combatLogBox.scrollHeight;
}

let combatSeconds = 0;
const startCombat = (battleMusic) => {
    bgmDungeon.pause();
    sfxEncounter.play();
    battleMusic.play();
    player.inCombat = true;
    setTimeout(playerAttack, (1000 / player.stats.atkSpd));
    setTimeout(enemyAttack, (1000 / enemy.stats.atkSpd));
    let dimDungeon = document.querySelector('#dungeon-main');
    dimDungeon.style.filter = "brightness(50%)";
    playerLoadStats();
    enemyLoadStats();
    dungeon.status.event = true;
    combatPanel.style.display = "flex";
    combatTimer = setInterval(combatCounter, 1000);
}

const endCombat = () => {
    bgmBattleMain.stop();
    bgmBattleGuardian.stop();
    bgmBattleBoss.stop();
    sfxCombatEnd.play();
    player.inCombat = false;
    if (player.skills.includes("Rampager")) {
        objectValidation();
        player.baseStats.atk -= player.tempStats.atk;
        player.tempStats.atk = 0;
        saveData();
    }
    if (player.skills.includes("Blade Dance")) {
        objectValidation();
        player.baseStats.atkSpd -= player.tempStats.atkSpd;
        player.tempStats.atkSpd = 0;
        saveData();
    }
    clearInterval(combatTimer);
    combatSeconds = 0;
}

const combatCounter = () => {
    combatSeconds++;
}

function createEnemyPanel(enemy) {
    return `
        <div class="battle-info-panel center" id="enemyPanel">
            <p>${enemy.name} Lv.${enemy.lvl}</p>
            <div class="battle-bar empty-bar hp bb-hp">
                <div class="battle-bar dmg bb-hp" id="enemy-hp-dmg"></div>
                <div class="battle-bar current bb-hp" id="enemy-hp-battle">
                    &nbsp${nFormatter(enemy.stats.hp)}/${nFormatter(enemy.stats.hpMax)}<br>(${enemy.stats.hpPercent}%)
                </div>
            </div>
            <div id="dmg-container"></div>
            <img src="./assets/sprites/${enemy.image.name}${enemy.image.type}" alt="${enemy.name}" width="${enemy.image.size}" id="enemy-sprite">
        </div>
    `;
}

function createPlayerPanel(player) {
    return `
        <div class="battle-info-panel primary-panel" id="playerPanel">
            <p id="player-combat-info"></p>
            <div class="battle-bar empty-bar bb-hp">
                <div class="battle-bar dmg bb-hp" id="player-hp-dmg"></div>
                <div class="battle-bar current bb-hp" id="player-hp-battle">
                    &nbsp${nFormatter(player.stats.hp)}/${nFormatter(player.stats.hpMax)}(${player.stats.hpPercent}%)
                </div>
            </div>
            <div class="battle-bar empty-bar bb-xb">
                <div class="battle-bar current bb-xb" id="player-exp-bar">exp</div>
            </div>
        </div>
    `;
}

const showCombatInfo = () => {
    const combatPanel = document.querySelector('#combatPanel');
    if (combatPanel) {
        combatPanel.innerHTML = `
            <div class="content">
                ${createEnemyPanel(enemy)}
                ${createPlayerPanel(player)}
                <div class="logBox primary-panel">
                    <div id="combatLogBox"></div>
                </div>
            </div>
        `;
    }
}
