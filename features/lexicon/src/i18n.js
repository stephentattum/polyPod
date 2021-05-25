import { determineLanguage, I18n } from "@polypoly-eu/silly-i18n";

export default new I18n(determineLanguage(), {
    en: {
        common: {
            back: "Back to list",
            search: "Search here",
            clear: "Clear search",
            copy: "Copy to clipboard",
            noMatch: "No results for your search.",
        },
        title: { lexicon: "Lexicon", details: "Term details" },
    },
    de: {
        common: {
            back: "Zurück zur Liste",
            search: "Suchen",
            clear: "Text löschen",
            copy: "In die Zwischenablage kopieren",
            noMatch: "Keine Ergebnisse für Ihre Suche.",
        },
        title: { lexicon: "Lexikon", details: "Details zum Eintrag" },
    },
});
