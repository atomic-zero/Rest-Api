const router = require("express").Router();
const { readdirSync } = require('fs-extra');
const path = require('path');
const kleur = require('kleur');

const color = {
    black: kleur.black,
    green: kleur.green,
    blue: kleur.blue,
    cyan: kleur.cyan,
    red: kleur.red,
    white: kleur.white,
    magenta: kleur.magenta,
    gray: kleur.gray,
    grey: kleur.grey
};

const { workers } = require("./workers");
const hajime = await workers();
const text = require("fontstyles");

const fonts = {
    italic: msg => text.italic(msg),
    bold: msg => text.bold(msg),
    underline: msg => text.underline(msg),
    strike: msg => text.strike(msg),
    monospace: msg => text.monospace(msg),
    roman: msg => text.roman(msg),
    bubble: msg => text.bubble(msg),
    squarebox: msg => text.squarebox(msg),
    origin: msg => text.origin(msg),
};

try {
    let n = 0;
    const srcPath = path.join(__dirname, "/api/");
    const apiFiles = readdirSync(srcPath).filter(file => file.endsWith(".js"));

    for (const file of apiFiles) {
        const filePath = path.join(srcPath, file);
        const script = require(filePath);

        // Ensure both config and initialize exist in the script
        if (script.config && script.initialize) {
            const { name, aliases = [] } = script.config; // Destructure name and aliases, defaulting to an empty array if aliases not provided

            // Register main route using the config name
            const routePath = '/' + name;
            router.get(routePath, (req, res) => script.initialize({
                req, res, hajime, fonts, font: fonts, color
            }));

            // Register routes for each alias if they exist
            aliases.forEach(alias => {
                const aliasRoutePath = '/' + alias;
                router.get(aliasRoutePath, (req, res) => script.initialize({
                    req, res, hajime, fonts, font: fonts, color
                }));
            });

            // Register the API into the global.api map using the name (only)
            global.api.set(name, script);

            n++;
            console.log(`${color.green('[ API ]')} ${color.cyan('→')} ${color.blue(`Successfully loaded ${file}`)}`);
        }
    }

    console.log(`${color.green('[ API ]')} ${color.cyan('→')} ${color.blue(`Successfully loaded ${n} API files`)}`);
} catch (error) {
    console.error(`${color.green('[ API ]')} ${color.cyan('→')} ${color.blue(`Error loading API files: ${error.message}`)}`);
}

process.on("unhandledRejection", reason => {
    console.error('Unhandled Rejection:', reason);
});

process.on("uncaughtException", error => {
    console.error('Uncaught Exception:', error);
});

module.exports = router;