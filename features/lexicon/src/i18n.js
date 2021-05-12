import { determineLanguage, I18n } from "@polypoly-eu/silly-i18n";

export default new I18n(determineLanguage(), {
    en: {
        common: { back: "Back to list", search: "Search here", clear: "Clear search", noMatch: "No results for your search." },
    },
    de: {
        common: { back: "Zurück zur Liste", search: "Suchen", clear: "Text löschen", noMatch: "Keine Ergebnisse für Ihre Suche." },
    },
});