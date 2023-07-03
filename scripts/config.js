import {MODULE_ID} from "./main.js";

import { EmojifyApp } from "./emojifyApp.js";

export function initConfig() {
    game.keybindings.register(MODULE_ID, "toggleEmoji", {
        name: game.i18n.localize(`${MODULE_ID}.toggleEmoji`),
        editable: [{key: "KeyE", modifiers: [KeyboardManager.MODIFIER_KEYS.SHIFT]}],
        restricted: true,
        onDown: () => {
            new EmojifyApp().render(true);
        },
        onUp: () => {},
        precedence: CONST.KEYBINDING_PRECEDENCE.PRIORITY,
    });

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

    game.settings.register(MODULE_ID, "autoClose", {
        name: game.i18n.localize(`${MODULE_ID}.settings.autoClose.name`),
        hint: game.i18n.localize(`${MODULE_ID}.settings.autoClose.hint`),
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
    });
}