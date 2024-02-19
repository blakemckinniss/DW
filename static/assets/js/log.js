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

