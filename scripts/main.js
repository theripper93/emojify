import {initConfig} from "./config.js";
import {registerSettings} from "./settings.js";
import {EmojifyApp} from "./app/emojifyApp.js";

export const MODULE_ID = "emojify";

Hooks.on("init", () => {
    initConfig();
    registerSettings();
    ui.emojify = {
        mousePosition: {
            x: 0,
            y: 0,
        },
        open: () => {
            new EmojifyApp().render({ force: true });
        },
        EmojifyApp,
    };

    document.addEventListener("mousemove", (event) => {
        ui.emojify.mousePosition.x = event.clientX;
        ui.emojify.mousePosition.y = event.clientY;
    });

    game.socket.on("module.emojify", EmojifyApp.processSocketData);

    if (game.settings.get(MODULE_ID, "preload")) {
        EmojifyApp.preload();
    }

    Hooks.once("ready", () => {
        if (!game.settings.get(MODULE_ID, "firstTimeMessage")) {
            ui.notifications.info(game.i18n.localize(`${MODULE_ID}.welcome`), {permanent: true});
            game.settings.set(MODULE_ID, "firstTimeMessage", true);
        }
    });
});
