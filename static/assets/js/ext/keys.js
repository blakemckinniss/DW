const PLAYERNAME = "Jinx";
const MAX_LEVEL = 100;
const TIER_CAP = 10;
const MAX_STAT_MULTIPLIERS = { hp: 40, atkDef: 16, cdAtkSpd: 3, crVamp: 2 };
const STAT_CAPS = { atkSpd: 15, vamp: 8, critRate: 10 };
const GOLD_WRAPPER = '<i class="fas fa-coins" style="color: #FFD700;"></i><span class="Common">${1}</span>'
const statNamesRequiringPercentage = new Set(["critRate", "critDmg", "atkSpd", "vamp"]);
const regexTrailingZeros = /\.0+$|(\.[0-9]*[1-9])0+$/;
const BASE_STATS = {
  hp: 500,
  atk: 100,
  def: 50,
  pen: 0,
  atkSpd: 0.6,
  vamp: 0,
  critRate: 0,
  critDmg: 50
};
const EXP_DEFAULTS = {
  expCurr: 0,
  expMax: 100,
  expCurrLvl: 0,
  expMaxLvl: 100,
  lvlGained: 0
};
const statsConfig = {
  Damage: {
      Axe: ["atk", "atk", "vamp", "critRate", "critDmg", "critDmg"],
      Scythe: ["atk", "atk", "vamp", "critRate", "critDmg", "critDmg"],
      Dagger: ["atkSpd", "atkSpd", "atk", "vamp", "critRate", "critRate", "critDmg"],
      Flail: ["atkSpd", "atkSpd", "atk", "vamp", "critRate", "critRate", "critDmg"],
      Hammer: ["hp", "def", "atk", "atk", "critRate", "critDmg"],
      default: ["atk", "atkSpd", "vamp", "critRate", "critDmg"]
  },
  Defense: ["hp", "hp", "def", "def", "atk"]
};
const skillEffects = {
    "Remnant Razor": {
        type: "percentageOfEnemyHp",
        value: 8
    },
    "Titan's Will": {
        type: "percentageOfPlayerHpMax",
        value: 5
    },
    "Devastator": {
        type: "percentageOfDamage",
        value: 30
    }
};
const equipmentOptions = {
  Damage: {
      type: "Weapon",
      categories: ["Sword", "Axe", "Hammer", "Dagger", "Flail", "Scythe"]
  },
  Defense: {
      types: {
          Armor: ["Plate", "Chain", "Leather"],
          Shield: ["Tower", "Kite", "Buckler"],
          Helmet: ["Great Helm", "Horned Helm"]
      }
  }
};
const rarityChances = {
  "Common": 0.7,
  "Uncommon": 0.2,
  "Rare": 0.04,
  "Epic": 0.03,
  "Legendary": 0.02,
  "Heirloom": 0.01
};
const trapTypes = ["spike pit", "arrow trap", "magical snare"];
const iconMap = {
  hp: "fas fa-heart", 
  atk: "ra ra-sword",
  def: "ra ra-round-shield",
  atkspd: "ra ra-player-dodge",
  vamp: "ra ra-dripping-blade",
  crate: "ra ra-knife", 
  cdmg: "ra ra-focused-lightning",
  strength: "ra ra-muscle-up", 
  energy: "ra ra-lightning-bolt", 
  luck: "ra ra-clover"
};
const equipmentIcons = {
  "Sword": "ra-relic-blade",
  "Axe": "ra-axe",
  "Hammer": "ra-flat-hammer",
  "Dagger": "ra-bowie-knife",
  "Flail": "ra-chain",
  "Scythe": "ra-scythe",
  "Plate": "ra-vest",
  "Chain": "ra-vest",
  "Leather": "ra-vest",
  "Tower": "ra-shield",
  "Kite": "ra-heavy-shield",
  "Buckler": "ra-round-shield",
  "Great Helm": "ra-knight-helmet",
  "Horned Helm": "ra-helmet"
};
const eventWeights = [
  { type: 'nextroom', weight: 10 },
  { type: 'vixenCamp', weight: 5 },
  { type: 'treasure', weight: 20 },
  { type: 'enemy', weight: 30 },
  { type: 'nothing', weight: 15 },
  { type: 'blessing', weight: 5 },
  { type: 'curse', weight: 5 },
  { type: 'trap', weight: 5 },
  { type: 'monarch', weight: 5 },
];
const skillDescriptions = {
  "Remnant Razor": "Attacks deal extra 8% of enemies' current health on hit.",
  "Titan's Will": "Attacks deal extra 5% of your maximum health on hit.",
  "Devastator": "Deal 30% more damage but you lose 30% base attack speed.",
  "Rampager": "Increase attack by 5 after each hit. Stack resets after battle.",
  "Blade Dance": "Gain increased attack speed after each hit. Stack resets after battle.",
  "Paladin's Heart": "You receive 25% less damage permanently.",
  "Aegis Thorns": "Enemies receive 15% of the damage they dealt."
};

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


function statusHandler() {
  return {
    set(target, property, value) {
      const result = Reflect.set(...arguments);
      if (target.exploring === false && target.paused === false && target.event === false) {
        dungeonStartPause
      }
      return result;
    }
  };
}

function dungeonHandler() {
  return {
    get(target, property, receiver) {
      if (property === 'status' && !target._statusProxy) {
        target._statusProxy = new Proxy(target.status, statusHandler());
        
        return target._statusProxy;
      }
      return Reflect.get(...arguments);
    },
    set(target, property, value) {
      if (property === 'status') {
        
        value = new Proxy(value, statusHandler());
      }
      return Reflect.set(...arguments);
    }
  };
}

dungeon = new Proxy(dungeon, dungeonHandler());

const confirmQuitHtml = `
<div class="content">
  <div class="content-head">
    <h3>Confirm Abandonment</h3>
    <p id="quit-close"><i class="fa fa-xmark"></i></p>
  </div>
  <p>Do you really want to abandon the run?</p>
  <div class="button-container">
    <button id="confirm-quit">Yes, abandon</button>
    <button id="cancel-quit">No, return</button>
  </div>
</div>`;

const defaultModalElementHtml = `
<div class="content">
    <p>Do you want to abandon this run?</p>
    <div class="button-container">
        <button id="quit-run">Abandon</button>
        <button id="cancel-quit">Cancel</button>
    </div>
</div>`;

const statConfig = {
  hp: { base: 50, multiplier: (value) => value * 50 },
  atk: { base: 10, multiplier: (value) => value * 10 },
  def: { base: 10, multiplier: (value) => value * 10 },
  atkSpd: { base: 0.4, multiplier: (value) => 0.4 + (0.02 * value) }
};