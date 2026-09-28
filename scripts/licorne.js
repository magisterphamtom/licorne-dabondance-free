/* =========================================================================
 *  Licorne d'Abondance (Free) — script de module
 *  - Logo de pause personnalisé (hook d'origine conservé)
 *  - Wiki hybride (ApplicationV2) : bannière + boutons vers le contenu
 *  - Ouverture automatique pour le MJ (une seule fois par monde)
 *  - Bouton d'accès dans l'en-tête de l'onglet Journal de la sidebar
 * ========================================================================= */

const MODULE_ID = "licorne-dabondance-free";

/* -------------------------------------------------------------------------
 *  CONFIG — ajuste ces valeurs si les noms de tes documents diffèrent.
 * ------------------------------------------------------------------------- */
const WIKI = {
  cover: `modules/${MODULE_ID}/assets/artwork/licorne-cover.webp`,
  actorsPack: `${MODULE_ID}.actors`,
  tablesPack: `${MODULE_ID}.tables`,
  scenesPack: `${MODULE_ID}.scenes`
};

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/* =========================================================================
 *  Application hybride
 * ========================================================================= */
class LicorneWiki extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    id: "licorne-wiki",
    classes: ["licorne-wiki"],
    tag: "div",
    window: {
      title: "Licorne d'Abondance (Gratuit)",
      icon: "fa-solid fa-book-sparkles",
      resizable: true
    },
    position: { width: 560, height: "auto" },
    actions: {
      openActors: LicorneWiki.#openActors,
      openTables: LicorneWiki.#openTables,
      openScenes: LicorneWiki.#openScenes
    }
  };

  static PARTS = {
    body: { template: `modules/${MODULE_ID}/templates/wiki.hbs` }
  };

  async _prepareContext() {
    return { cover: WIKI.cover, isGM: game.user.isGM };
  }

  /* --- Helpers de navigation --------------------------------------------- */

  // Ouvre le compendium (la fenêtre de parcours) pour PNJ / Tables / Scènes.
  static async #openPack(packId, label) {
    const pack = game.packs.get(packId);
    if (!pack) return ui.notifications.warn(`Licorne : compendium « ${label} » introuvable.`);
    return pack.render(true);
  }

  static async #openActors() {
    return LicorneWiki.#openPack(WIKI.actorsPack, "PNJ et Créatures");
  }

  static async #openTables() {
    return LicorneWiki.#openPack(WIKI.tablesPack, "Tables aléatoires");
  }

  static async #openScenes() {
    return LicorneWiki.#openPack(WIKI.scenesPack, "Scènes");
  }
}

/* Instance unique réutilisée */
let _wikiApp = null;
function openWiki() {
  if (!_wikiApp) _wikiApp = new LicorneWiki();
  _wikiApp.render(true);
}

/* =========================================================================
 *  Logo de pause personnalisé  (hook d'origine, conservé tel quel)
 * ========================================================================= */
Hooks.on("ready", () => {
  const observer = new MutationObserver(() => {
    const pauseImg = document.querySelector("figure#pause img");
    if (pauseImg && !pauseImg.src.includes("logo.webp")) {
      pauseImg.src = `modules/${MODULE_ID}/assets/artwork/logo.webp`;
      pauseImg.style.width = "150px";
      pauseImg.style.height = "150px";
      pauseImg.style.objectFit = "contain";
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
});

/* =========================================================================
 *  Ouverture automatique pour le MJ, une seule fois par monde
 * ========================================================================= */
Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "wikiShown", {
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });
});

Hooks.once("ready", async () => {
  if (!game.user.isGM) return;
  const alreadyShown = game.settings.get(MODULE_ID, "wikiShown");
  if (!alreadyShown) {
    openWiki();
    await game.settings.set(MODULE_ID, "wikiShown", true);
  }
});

/* =========================================================================
 *  Bouton d'accès dans l'en-tête de l'onglet Journal de la sidebar
 *  (point d'extension stable en V14 — pas de hack d'onglet natif)
 * ========================================================================= */
Hooks.on("renderJournalDirectory", (app, html) => {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;
  if (root.querySelector(".licorne-wiki-btn")) return;

  const header = root.querySelector(".directory-header") || root.querySelector("header");
  if (!header) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "licorne-wiki-btn";
  btn.innerHTML = `<i class="fa-solid fa-book-sparkles"></i> Licorne d'Abondance`;
  btn.addEventListener("click", () => openWiki());

  header.prepend(btn);
});