class DungeonEvent {
    constructor(player, dungeon) {
        this.player = player;
        this.dungeon = dungeon;
    }
    execute() {
        throw new Error('Execute method must be implemented');
    }
}

class Choice {
    constructor(description, action) {
        this.description = description;
        this.action = action;
    }
}

class ChoiceEvent extends DungeonEvent {
    constructor(player, dungeon, message, choices) {
        super(player, dungeon);
        this.message = message;
        this.choices = choices;
    }

    execute() {
        let choicesMarkup = '<div class="decision-panel">';
        this.choices.forEach((choice, index) => {
            const choiceId = `choice${index + 1}`;
            choicesMarkup += `<button id="${choiceId}">${choice.description}</button>`;
        });
        choicesMarkup += '</div>';
        addDungeonLog(this.message, choicesMarkup);

        this.choices.forEach((choice, index) => {
            const choiceId = `choice${index + 1}`;
            document.querySelector(`#${choiceId}`).onclick = () => choice.action();
            dungeon.status.exploring = false;
        });
    }
}

class NextRoomEvent extends DungeonEvent {
    execute() {
        const handleNextRoom = () => {
            let eventRoll = randomizeNum(1, 3);
            if (eventRoll == 1) {
                incrementRoom();
                mimicBattle("door");
                addDungeonLog("You moved to the next floor.");
            } else if (eventRoll == 2) {
                incrementRoom();
                const chestChoices = [
                    new Choice("Open the chest", chestEvent),
                    new Choice("Ignore", () => {
                        this.dungeon.action = 0;
                        ignoreEvent();
                    })
                ];
                const chestMessage = `You moved to the next room and found a treasure chamber. There is a <i class="fa fa-toolbox"></i>Chest inside.`;
                new ChoiceEvent(this.player, this.dungeon, chestMessage, chestChoices).execute();
            } else {
                this.dungeon.status.event = false;
                incrementRoom();
                addDungeonLog("You moved to the next room.");
            }
        };

        const enterAction = () => {
            sfxConfirm.play();
            if (this.dungeon.progress.room == this.dungeon.progress.roomLimit) {
                guardianBattle();
            } else {
                handleNextRoom();
            }
        };

        const ignoreAction = () => {
            this.dungeon.action = 0;
            ignoreEvent();
        };

        const choices = [
            new Choice("Enter", enterAction),
            new Choice("Ignore", ignoreAction)
        ];

        const message = this.dungeon.progress.room == this.dungeon.progress.roomLimit ?
            `<span class="Heirloom">You found the door to the boss room.</span>` :
            "You found a door.";
        new ChoiceEvent(this.player, this.dungeon, message, choices).execute();
    }
}


class VixenCampEvent extends DungeonEvent {
    execute() {
        const choices = [
            new Choice("Recruit", recruitVixen),
            new Choice("Ignore", ignoreEvent)
        ];
        const message = "You've stumbled upon a vixen Camp. Do you wish to recruit a new ally?";
        new ChoiceEvent(this.player, this.dungeon, message, choices).execute();
    }
}

class TreasureEvent extends DungeonEvent {
    execute() {
        const choices = [
            new Choice("Open the chest", chestEvent),
            new Choice("Ignore", ignoreEvent)
        ];
        const message = `You found a treasure chamber. There is a <i class="fa fa-toolbox"></i>Chest inside.`;
        new ChoiceEvent(this.player, this.dungeon, message, choices).execute();
    }
}

class EnemyEvent extends DungeonEvent {
    execute() {
        generateRandomEnemy(); 
        const choices = [
            new Choice("Engage", () => {
                this.player.inCombat = true;
                engageBattle();
            }),
            new Choice("Flee", fleeBattle)
        ];
        const message = `You encountered ${enemy.name}.`;
        new ChoiceEvent(this.player, this.dungeon, message, choices).execute();
    }
}

class NothingEvent extends DungeonEvent {
    execute() {
        addDungeonLog("You find nothing of interest.");
        this.dungeon.status.event = false;
    }
}

class BlessingEvent extends DungeonEvent {
    execute() {
        let eventRoll = randomizeNum(1, 2);
        if (eventRoll === 1) {
            this.dungeon.status.event = true;
            blessingValidation(); // Ensure this function validates the possibility of a blessing
            let cost = this.player.blessing * (500 * (this.player.blessing * 0.5)) + 750;

            const offerAction = () => {
                if (this.player.gold < cost) {
                    sfxDeny.play();
                    addDungeonLog("You don't have enough gold.");
                } else {
                    this.player.gold -= cost;
                    sfxConfirm.play();
                    statBlessing(); // Ensure this function appropriately applies the blessing
                }
                this.dungeon.status.event = false;
            };

            const ignoreAction = () => {
                ignoreEvent();
            };

            const choices = [
                new Choice("Offer", offerAction),
                new Choice("Ignore", ignoreAction)
            ];

            const message = `<span class="Legendary">You found a Statue of Blessing. Do you want to offer <i class="fas fa-coins" style="color: #FFD700;"></i><span class="Common">${nFormatter(cost)}</span> to gain blessings? (Blessing Lv.${this.player.blessing})</span>`;
            new ChoiceEvent(this.player, this.dungeon, message, choices).execute();
        } else {
            new NothingEvent(this.player, this.dungeon).execute();
        }
    }
}

class CurseEvent extends DungeonEvent {
    execute() {
        let eventRoll = randomizeNum(1, 3);
        if (eventRoll === 1) {
            this.dungeon.status.event = true;
            let curseLvl = Math.round((this.dungeon.settings.enemyScaling - 1) * 10);
            let cost = curseLvl * (10000 * (curseLvl * 0.5)) + 5000;

            const offerAction = () => {
                if (this.player.gold < cost) {
                    sfxDeny.play();
                    addDungeonLog("You don't have enough gold.");
                } else {
                    this.player.gold -= cost;
                    sfxConfirm.play();
                    cursedTotem(curseLvl);
                }
                this.dungeon.status.event = false;
            };

            const ignoreAction = () => {
                ignoreEvent();
            };

            const choices = [
                new Choice("Offer", offerAction),
                new Choice("Ignore", ignoreAction)
            ];

            const GOLD_COST = template(GOLD_WRAPPER, nFormatter(cost));
            const genericMessageTemplate = wrapSpan(`You found a <span class='${1}'>${2}</span>. It will cost you ${GOLD_COST}. This will strengthen the monsters but will also improve the loot quality. (Level: ${3})`, "Heirloom");
            const message = template(genericMessageTemplate, "Legendary", "Cursed Totem", curseLvl);

            new ChoiceEvent(this.player, this.dungeon, message, choices).execute();
        } else {
            new NothingEvent(this.player, this.dungeon).execute();
        }
    }
}

class TrapEvent extends DungeonEvent {
    execute() {
        const selectedTrap = trapTypes[Math.floor(Math.random() * trapTypes.length)];
        const disarmAction = () => {
            disarmTrap(selectedTrap); // Make sure this function handles the logic for disarming the trap
        };
        const evadeAction = () => {
            evadeTrap(selectedTrap); // Make sure this function handles the logic for evading the trap
        };
        const choices = [
            new Choice("Disarm", disarmAction),
            new Choice("Evade", evadeAction)
        ];
        const message = `You encountered a ${selectedTrap}.`;
        new ChoiceEvent(this.player, this.dungeon, message, choices).execute();
    }
}

class MonarchEvent extends DungeonEvent {
    execute() {
        let eventRoll = randomizeNum(1, 7);
        if (eventRoll === 1) {
            const choices = [
                new Choice("Enter", () => specialBossBattle()),
                new Choice("Ignore", () => ignoreEvent())
            ];
            const message = `<span class="Heirloom">You found a mysterious chamber. It seems like there is something sleeping inside.</span>`;
            new ChoiceEvent(this.player, this.dungeon, message, choices).execute();
        } else {
            new NothingEvent(this.player, this.dungeon).execute();
        }
    }
}

class DungeonEventFactory {
    static createEvent(player, dungeon) {
        logDungeonEvent
        const eventType = selectWeightedEvent(eventWeights); // Use the weighted selection function
        switch (eventType) {
            case 'nextroom':
                return new NextRoomEvent(player, dungeon);
            case 'vixenCamp':
                return new VixenCampEvent(player, dungeon);
            case 'treasure':
                return new TreasureEvent(player, dungeon);
            case 'enemy':
                return new EnemyEvent(player, dungeon);
            case 'nothing':
                return new NothingEvent(player, dungeon);
            case 'blessing':
                return new BlessingEvent(player, dungeon);
            case 'curse':
                return new CurseEvent(player, dungeon);
            case 'trap':
                return new TrapEvent(player, dungeon);
            case 'monarch':
                return new MonarchEvent(player, dungeon);
            default:
                throw new Error('Unknown event type: ' + eventType);
        }
    }
}

function selectWeightedEvent(eventWeights) {
    const totalWeight = eventWeights.reduce((sum, event) => sum + event.weight, 0);
    let choice = Math.random() * totalWeight;
    for (let event of eventWeights) {
        choice -= event.weight;
        if (choice < 0) {
            return event.type;
        }
    }
}

function determineEventType(dungeonAction) {
    if (dungeonAction > 2 && dungeonAction < 6) {
        return "nextroom"; 
    } else if (dungeonAction > 5) {
        return "vixenCamp"; 
    }
    return "nextroom"; 
}

const dungeonEvent = () => {
    if (dungeon.status.exploring && !dungeon.status.event) {
        if (player.energy > 0) {
            player.energy -= player.energyCost;
            playerLoadStats();
        } else {
            dungeon.status.exploring = false;
            dungeon.status.event = false;
            addDungeonLog("You are too exhausted to continue exploring.", null, "You ran out of energy.");
        }

        dungeon.action++;
        let event = DungeonEventFactory.createEvent(player, dungeon);
        event.execute();
        sleep(2000);
    }
};