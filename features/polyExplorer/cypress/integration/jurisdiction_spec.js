const INDEX_ROUTE = "dist/index.html";

describe("Data region", () => {
    beforeEach(() => {
        cy.visit(INDEX_ROUTE);
        cy.get(".button-container button")
            .click()
            .then(() => {
                return cy
                    .get(
                        ".swiper-slide.swiper-slide-active .data-sharing-section.jurisdictions-shared .data-sharing-gauge"
                    )
                    .click();
            });
    });

    it("should throw an error if the graph has changed", () => {
        cy.matchImageSnapshot("jurisdictions0");
    });

    it("should throw an error if the jurisdiction info has changed", () => {
        cy.get(".jurisdiction-tree-container .data-sharing-legend")
            .click()
            .then(() => {
                cy.matchImageSnapshot("jurisdictionsinfo0");
            });
    });
});
