import { MODULE_ID } from "./main.js";

let emojiDB, fuseSearch;

const sizes = [0.5,1,1.5,2,3,4,5]


export class EmojifyApp extends Application{

    constructor () {
        super();
        this._onSearch = debounce(this._onSearch, 100);
    }

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            id: "emojify-app",
            classes: ["emojify-app"],
            template: `modules/emojify/templates/emojifyApp.hbs`,
            resizable: false,
            popOut: false,
            width: 200,
            height: 300,
        };
    }

    async getData() {
        if(!emojiDB) {
            emojiDB = await fetchJsonWithTimeout("modules/emojify/scripts/emojisDB.json");
            const Fuse = (await import("./fuse.js")).default;
            const options = {
                includeScore: true,
                keys: ["description", "category", "tags"],
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

    activateListeners(html) {
        super.activateListeners(html);
        html = html[0];

        const {width, height} = this.constructor.defaultOptions;
        this.element[0].style.left = `${ui.emojify.mousePosition.x - width / 2}px`;
        this.element[0].style.top = `${ui.emojify.mousePosition.y - height / 2}px`;


        html.querySelector(`input[type="search"]`).addEventListener("keydown", this._onSearch.bind(this));

        html.querySelectorAll(`#emoji-list li`).forEach(li => { 
            li.addEventListener("click", this._onEmojiClick.bind(this));
        });

        html.querySelector("span#size").addEventListener("mouseup", this._onSizeClick.bind(this));

        //close when clicking somewhere else
        document.addEventListener("click", this._onClickAway.bind(this));
        //focus input
        setTimeout(() => html.querySelector(`input[type="search"]`).focus(), 100);
        this.element[0].scrollTop = 0;
        this.updateRecent();
        //get header height
        const headerHeight = html.querySelector("header").offsetHeight;
        //set max height
        html.querySelector("#emoji-list").style.maxHeight = `calc( ${height - headerHeight}px - 0.6rem)`;
    }

    updateRecent() {
        const ul = this.element[0].querySelector("#recent-emoji");
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
        if(!isLeftClick && !isRightClick) return;
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
        if(!event.target.closest("#emojify-app")) {
            this.close();
        }
    }

    _onSearch(event) {
        //first test for enter key
        if (event.keyCode === 13) {
            const firstResult = this.element[0].querySelector("#emoji-list li");
            if (firstResult) return this._Emojify(firstResult.innerHTML);
        }
        const search = event.target.value;
        let emojis
        if (!search) emojis = emojiDB.map(e => e.emoji);
        else {            
            const results = fuseSearch.search(search);
            emojis = results.map(r => r.item.emoji);
        }
        const emojiUl = this.element[0].querySelector("#emoji-list");
        emojiUl.innerHTML = "";
        for (const emoji of emojis) {
            const li = document.createElement("li");
            li.innerHTML = emoji;
            li.addEventListener("click", this._onEmojiClick.bind(this));
            emojiUl.appendChild(li);
        }
    }

    get tokens() {
        return canvas.tokens.controlled;
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
        const size = parseFloat(this.element[0].querySelector("span#size").innerHTML);
        for (const token of tokens) {
            const avgSize = (token.w + token.h) / 2 * size;
            canvas.interface.createScrollingText(token.center, emoji, {fontSize: Math.round(avgSize), distance: 10})
        }
        const recent = game.settings.get(MODULE_ID, "recent").filter(e => e !== emoji);
        recent.unshift(emoji);
        game.settings.set(MODULE_ID, "recent", recent.slice(0, 10)).then(() => {
            setTimeout(() => this.updateRecent(), 100);
        });
        if(this.closeOnClick) this.close();
    }

    async close(...args) {
        document.removeEventListener("click", this._onClickAway.bind(this));
        return super.close(...args);
    }
}