const router = require("express").Router();
const { readdirSync } = require('fs-extra');
const path = require('path');
const { green, blue, cyan } = require('kleur');
const { workers } = require("./workers");

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
            router.get(routePath, (req, res) => script.initialize({ req, res, workers }));

            // Register routes for each alias if they exist
            aliases.forEach(alias => {
                const aliasRoutePath = '/' + alias;
                router.get(aliasRoutePath, (req, res) => script.initialize({ req, res, workers }));
            });

            // Register the API into the global.api map using the name (only)
            global.api.set(name, script);

            n++;
            console.log(`${green('[ API ]')} ${cyan('→')} ${blue(`Successfully loaded ${file}`)}`);
        }
    }

    console.log(`${green('[ API ]')} ${cyan('→')} ${blue(`Successfully loaded ${n} API files`)}`);
} catch (error) {
    console.error(`${green('[ API ]')} ${cyan('→')} ${blue(`Error loading API files: ${error.message}`)}`);
}

process.on("unhandledRejection", reason => {
    console.error('Unhandled Rejection:', reason);
});

process.on("uncaughtException", error => {
    console.error('Uncaught Exception:', error);
});

module.exports = router;