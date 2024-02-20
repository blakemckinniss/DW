/**
 * A flexible message template function that replaces placeholders in a template string
 * with provided values.
 * 
 * Usage example:
 * const messageTemplate = "You found a <span class='${style}'>${itemName}</span>. It will cost you ${cost} coins. (Level: ${level})";
 * const message = template(messageTemplate, "Legendary", "Cursed Totem", 5000, 10);
 * 
 * @param {string} templateString - The template string with placeholders.
 * @param  {...any} values - A variable number of values to replace in the template.
 * @return {string} The formatted message string with placeholders filled.
 */
function template(templateString, ...values) {
    return templateString.replace(/\$\{(\d+)\}/g, (match, index) => {
        // Subtract 1 from index because values are 1-indexed in the template
        return values[index - 1] !== undefined ? values[index - 1] : match;
    });
}

function wrapSpan(text, className) {
    return `<span class="${className}">${text}</span>`;
}
