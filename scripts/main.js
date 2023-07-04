import {initConfig} from "./config.js";
import {registerSettings} from "./settings.js";
import {EmojifyApp} from "./emojifyApp.js";

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
            new EmojifyApp().render(true);
        },
    };

    document.addEventListener("mousemove", (event) => {
        ui.emojify.mousePosition.x = event.clientX;
        ui.emojify.mousePosition.y = event.clientY;
    });

    game.socket.on("module.emojify", EmojifyApp.processSocketData);
});