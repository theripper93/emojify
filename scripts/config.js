import {MODULE_ID} from "./main.js";

import { EmojifyApp } from "./emojifyApp.js";

export function initConfig() {
    game.keybindings.register(MODULE_ID, "toggleEmoji", {
        name: game.i18n.localize(`${MODULE_ID}.toggleEmoji`),
        editable: [{key: "KeyV", modifiers: [foundry.helpers.interaction.KeyboardManager.MODIFIER_KEYS.SHIFT]}],
        restricted: false,
        onDown: () => {
            new EmojifyApp().render(true);
        },
        onUp: () => {},
        precedence: CONST.KEYBINDING_PRECEDENCE.PRIORITY,
    });
}