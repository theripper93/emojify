import {MODULE_ID} from "./main.js";

export function registerSettings() {
    game.settings.register(MODULE_ID, "recent", {
        scope: "client",
        config: false,
        type: Array,
        default: [],
    });

    game.settings.register(MODULE_ID, "size", {
        scope: "client",
        config: false,
        type: Number,
        default: 1,
    });

    game.settings.register(MODULE_ID, "firstTimeMessage", {
        scope: "client",
        config: false,
        type: Boolean,
        default: false,
    });

    game.settings.register(MODULE_ID, "preload", {
        name: game.i18n.localize(`${MODULE_ID}.settings.preload.name`),
        hint: game.i18n.localize(`${MODULE_ID}.settings.preload.hint`),
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
    });

    game.settings.register(MODULE_ID, "autoClose", {
        name: game.i18n.localize(`${MODULE_ID}.settings.autoClose.name`),
        hint: game.i18n.localize(`${MODULE_ID}.settings.autoClose.hint`),
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
    });


}