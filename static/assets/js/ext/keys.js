let GOLD_WRAPPER = '<i class="fas fa-coins" style="color: #FFD700;"></i><span class="Common">${1}</span>'

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

// Function to handle setting properties on the status object
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

// Function to handle setting properties on the dungeon object
function dungeonHandler() {
  return {
    get(target, property, receiver) {
      if (property === 'status' && !target._statusProxy) {
        target._statusProxy = new Proxy(target.status, statusHandler());
        // Return the proxied status object
        return target._statusProxy;
      }
      return Reflect.get(...arguments);
    },
    set(target, property, value) {
      if (property === 'status') {
        // Ensure changes to status are also proxied
        value = new Proxy(value, statusHandler());
      }
      return Reflect.set(...arguments);
    }
  };
}

dungeon = new Proxy(dungeon, dungeonHandler());

const iconMap = {
    hp: "fas fa-heart", // Using FontAwesome for HP as per the given HTML
    atk: "ra ra-sword",
    def: "ra ra-round-shield",
    atkspd: "ra ra-player-dodge",
    vamp: "ra ra-dripping-blade",
    crate: "ra ra-knife", // Assuming crate stands for Critical Rate
    cdmg: "ra ra-focused-lightning",
    strength: "ra ra-muscle-up", // Assuming you pass 'strength' for the strength stat
    energy: "ra ra-lightning-bolt", // Note: Duplicate with crate, might need special handling if both are displayed together
    luck: "ra ra-clover"
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

const trapTypes = ["spike pit", "arrow trap", "magical snare"];