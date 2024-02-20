// Format large numbers
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

// Get a randomized number between 2 integers
const randomizeNum = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.round(Math.floor(Math.random() * (max - min + 1)) + min); //The maximum is inclusive and the minimum is inclusive 
}

// Get a randomized decimal between 2 numbers
const randomizeDecimal = (min, max) => {
    return Math.random() * (max - min) + min;
}

function toggleExploring(dungeon) {
    if (dungeon.status.event && dungeon.status.exploring) {
        dungeon.status.event = false;
    }
    dungeon.status.exploring = true;
}

// Select the target node
const targetNode = document.getElementById('dungeonLog');

// Callback function to execute when mutations are observed
const callback = function(mutationsList, observer) {
    // Check each mutation
    for(const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            const pElements = targetNode.querySelectorAll('p');
            if (pElements.length > 2) {
                // Select the oldest <p> element
                const oldestP = pElements[0];
                
                // Listen for the end of the transition
                oldestP.addEventListener('transitionend', function() {
                    this.remove(); // Remove the element after transition ends
                    if (dungeon.backlog.length > 0) {
                        // Remove the first item from dungeon.backlog
                        dungeon.backlog.shift();
                    }
                }, { once: true }); // Ensures the listener is removed after execution
                
                // Add fade-out class to start the transition
                oldestP.classList.add('fade-out');
            }
        }
    }
};

// Observer instance linked to the callback function
const observer = new MutationObserver(callback);

// Configuration for the observer (what mutations to observe)
const config = { childList: true };

// Start observing the target node with the configured mutations
observer.observe(targetNode, config);

// Use observer.disconnect() when you need to stop observing
function sleep(milliseconds) {
    const start = new Date().getTime();
    while (new Date().getTime() - start < milliseconds) {
        // Busy wait does nothing while blocking execution
    }
}
