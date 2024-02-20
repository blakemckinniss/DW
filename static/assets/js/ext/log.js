function formatTimestamp(timestamp) {
    // Simple formatting for timestamp, adjust as needed
    return timestamp.getHours() + ':' + timestamp.getMinutes().toString().padStart(2, '0');
}
function addExplorationLog(message) {
    addLogEntry(message, 'exploration');
}

function addCombatLogItem(message) {
    addLogEntry(message, 'combat');
}

function addInventoryLog(message) {
    addLogEntry(message, 'inventory');
}

// ========= Dungeon Backlog ==========
// Displays every dungeon activity
// Updated updateDungeonLog function to handle choices more flexibly
const updateDungeonLog = (choices) => {
    const logContainer = document.querySelector("#dungeonLog");
    logContainer.innerHTML = ''; // Clear current log entries

    // Calculate the start index to slice the last 10 entries
    const startIndex = Math.max(dungeon.backlog.length - 8, 0);
    const recentEntries = dungeon.backlog.slice(startIndex);

    recentEntries.forEach(message => {
        const messageElement = document.createElement("p");
        messageElement.innerHTML = message;
        logContainer.appendChild(messageElement);
    });

    // If the event has choices, display them
    if (choices) {
        let eventChoices = document.createElement("div");
        eventChoices.innerHTML = choices;
        logContainer.appendChild(eventChoices);
    }

    // Scroll to the bottom of the log container to ensure the most recent entries are visible
    logContainer.scrollTop = logContainer.scrollHeight;
};

/**
 * Enhanced addDungeonLog to accept subject as a string or an object with potential rarity.
 * @param {string} message - The log message with a placeholder for the subject.
 * @param {string|null} choices - Any choices related to the log entry.
 * @param {string|object} subjectObj - The subject of the log entry or an object containing the subject's details.
 */
const addDungeonLog = (message, choices, subjectObj = "") => {
    let subject = subjectObj;
    let rarityClass = ""; // Default class
    
    // If subjectObj is an object and contains a rarity, use it to determine the styling
    if (typeof subjectObj === "object" && subjectObj.rarity) {
        rarityClass = `rarity-${subjectObj.rarity.toLowerCase()}`;
        subject = `<span class="${rarityClass}">${subjectObj.name}</span>`;
    }

    // Replace "<subject>" in the message with the styled subject
    message = message.replace("<subject>", subject);

    dungeon.backlog.push(message);
    updateDungeonLog(choices);
};