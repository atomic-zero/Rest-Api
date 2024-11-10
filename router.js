const router = require("express").Router();
const { readdirSync } = require('fs-extra');
const path = require('path');
const kleur = require('kleur');
const { validator } = require('./alive');
const { workers } = require("./workers");
const text = require("fontstyles");

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

const initializeApi = async () => {
    try {
        let n = 0;
        const hajime = await workers();
        const srcPath = path.join(__dirname, "/api/");
        const apiFiles = readdirSync(srcPath).filter(file => file.endsWith(".js"));

        for (const file of apiFiles) {
            const filePath = path.join(srcPath, file);
            const script = require(filePath);

            if (script.config && script.initialize) {

                const { name, aliases = [], credits, author } = script.config;

                const isValid = await validator(credits || author);

                const routeHandler = isValid
                    ? (req, res) => script.initialize({ req, res, hajime, fonts, font: fonts, color })
                    : (req, res) => {
                        res.status(500).json({
                            status: false,
                            message: "Error: Something went wrong, the API might be dead already"
                        });
                    };

                const routePath = '/' + name;
                router.get(routePath, routeHandler);

                aliases.forEach(alias => {
                    const aliasRoutePath = '/' + alias;
                    router.get(aliasRoutePath, routeHandler);
                });

                global.api.set(name, script);

                n++;
                console.log(`${color.green('[ API ]')} ${color.cyan('→')} ${color.blue(`Successfully loaded ${file}`)}`);
            }
        }

        console.log(`${color.green('[ API ]')} ${color.cyan('→')} ${color.blue(`Successfully loaded ${n} API files`)}`);
    } catch (error) {
        console.error(`${color.green('[ API ]')} ${color.cyan('→')} ${color.blue(`Error loading API files: ${error.message}`)}`);
    }
};

initializeApi();

process.on("unhandledRejection", reason => {
    console.error('Unhandled Rejection:', reason);
});

process.on("uncaughtException", error => {
    console.error('Uncaught Exception:', error);
});

module.exports = router;
