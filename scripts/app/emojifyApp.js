import { MODULE_ID } from "../main.js";
import { getProperty, HandlebarsApplication, mergeClone, confirm } from "../lib/utils.js";
import  { default as Fuse } from "fuse.js";

let emojiDB, fuseSearch;

const sizes = [0.5, 1, 1.5, 2, 3, 4, 5];

export class EmojifyApp extends HandlebarsApplication {
    constructor() {
        super();
        this.search = "";
        this._onSearch = foundry.utils.debounce(this._onSearch, 100);
        this.boundOnClickAway = this._onClickAway.bind(this);
        this.boundOnPressKey = this._onPressKey.bind(this);
    }

    static get DEFAULT_OPTIONS() {
      return mergeClone(super.DEFAULT_OPTIONS, {
        classes: ["emojify-app"],
        window: {
          frame: false,
          positioned: true,
          minimizable: false,
          contentClasses: [],
        },
        position: {
          width: 200,
          height: 300,
        },
      });
    }

    static processSocketData(data) {
        for (const scrollingText of data) {
            const token = canvas.tokens.get(scrollingText.tokenId);
            if (!token?.visible) continue;
            canvas.interface.createScrollingText(token.center, scrollingText.emoji, scrollingText.scrollingTextData);
        }
    }

    static async preload() {
        return this.prototype.getData();
    }

    async getData() {
        if (!emojiDB) {
            emojiDB = await foundry.utils.fetchJsonWithTimeout("modules/emojify/scripts/emojisDB.json");
            const options = {
                includeScore: true,
                keys: ["description", "category", "tags", "aliases"],
                threshold: 0.5,
            };
            fuseSearch = new Fuse(emojiDB, options);
        }
        return {
            emojis: emojiDB,
            recent: game.settings.get(MODULE_ID, "recent"),
            size: game.settings.get(MODULE_ID, "size"),
        };
    }

    _onRender(context, options) {
        super._onRender(context, options);
        const html = this.element;

        const { width, height } = this.constructor.DEFAULT_OPTIONS.position;

        this.setPosition({ left: ui.emojify.mousePosition.x - width / 2, top: ui.emojify.mousePosition.y - height / 2 });

        html.querySelector(`input[type="search"]`).addEventListener("keydown", this._onSearch.bind(this));

        html.querySelectorAll(`#emoji-list li`).forEach((li) => {
            li.addEventListener("click", this._onEmojiClick.bind(this));
        });

        html.querySelector("span#size").addEventListener("mouseup", this._onSizeClick.bind(this));

        //close when clicking somewhere else
        document.addEventListener("click", this.boundOnClickAway);
        html.addEventListener("keydown", this.boundOnPressKey);
        //focus input
        setTimeout(() => html.querySelector(`input[type="search"]`).focus(), 100);
        this.element.scrollTop = 0;
        this.updateRecent();
        //get header height
        const headerHeight = html.querySelector("header").offsetHeight;
        //set max height
        html.querySelector("#emoji-list").style.maxHeight = `calc( ${height - headerHeight}px - 0.8rem)`;
    }

    updateRecent() {
        const ul = this.element.querySelector("#recent-emoji");
        const recent = game.settings.get(MODULE_ID, "recent");
        ul.innerHTML = "";
        for (const emoji of recent) {
            const li = document.createElement("li");
            li.innerHTML = emoji;
            li.addEventListener("click", this._onEmojiClick.bind(this));
            ul.appendChild(li);
        }
    }

    _onSizeClick(event) {
        const currentSize = parseFloat(event.target.innerHTML);
        const isLeftClick = event.button === 0;
        const isRightClick = event.button === 2;
        if (!isLeftClick && !isRightClick) return;
        let newSize;
        if (isLeftClick) {
            newSize = sizes[(sizes.indexOf(currentSize) + 1) % sizes.length];
        }
        if (isRightClick) {
            newSize = sizes[(sizes.indexOf(currentSize) - 1 + sizes.length) % sizes.length];
        }
        event.target.innerHTML = newSize + "x";
        game.settings.set(MODULE_ID, "size", newSize);
    }

    _onClickAway(event) {
        if (!event.target.closest("#emojify-app")) {
            this.close();
        }
    }

    _onPressKey(event) {
        if (event.key === "Escape") {
            if (!this.search) {
                this.close();
            }
        }
    }

    _onSearch(event) {
        //first test for enter key
        if (event.keyCode === 13) {
            const firstResult = this.element.querySelector("#emoji-list li");
            if (firstResult) return this._Emojify(firstResult.innerHTML);
        }
        this.search = event.target.value;
        let emojis;
        if (!this.search) emojis = emojiDB.map((e) => e.emoji);
        else {
            const results = fuseSearch.search(this.search);
            emojis = results.map((r) => r.item.emoji);
        }
        const emojiUl = this.element.querySelector("#emoji-list");
        emojiUl.innerHTML = "";
        for (const emoji of emojis) {
            const li = document.createElement("li");
            li.innerHTML = emoji;
            li.addEventListener("click", this._onEmojiClick.bind(this));
            emojiUl.appendChild(li);
        }
    }

    get tokens() {
        const controlled = canvas.tokens.controlled;
        if (!controlled.length && !game.user.isGM) return canvas.tokens.ownedTokens;
        if (!controlled.length && game.user.isGM && _token) return [_token];
        return controlled;
    }

    get closeOnClick() {
        return game.settings.get(MODULE_ID, "autoClose");
    }

    _onEmojiClick(event) {
        const emoji = event.target.innerHTML;
        this._Emojify(emoji);
    }

    _Emojify(emoji) {
        const tokens = this.tokens;
        if (!tokens.length) return ui.notifications.warn(game.i18n.localize(`${MODULE_ID}.noTokenSelected`));
        const size = parseFloat(this.element.querySelector("span#size").innerHTML);
        const emojifyData = [];
        for (const token of tokens) {
            const avgSize = ((token.w + token.h) / 2) * size;
            emojifyData.push({ tokenId: token.id, emoji, scrollingTextData: { fontSize: Math.round(avgSize), distance: 10 } });
        }
        game.socket.emit("module.emojify", emojifyData, {
            recipients: Array.from(game.users)
                .filter((u) => u.active)
                .map((u) => u.id),
        });
        const recent = game.settings.get(MODULE_ID, "recent").filter((e) => e !== emoji);
        recent.unshift(emoji);
        game.settings.set(MODULE_ID, "recent", recent.slice(0, 10)).then(() => {
            setTimeout(() => {
                this.updateRecent();
                if (this.closeOnClick) this.close();
            }, 100);
        });
    }

    _onClose(options) {
        document.removeEventListener("click", this.boundOnClickAway);
        super._onClose(options);
    }
}
