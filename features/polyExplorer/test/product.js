"use strict";

import assert from "assert";
import * as product from "../src/model/product.js";
import testProductJSON from "./testProductData.js";
import testGlobalJSON from "./testGlobal.js";

const i18n = {
    language: "en",
};

const correctProductOwnerEnumeration = "Owner1, Owner2, Owner3";

describe("Product", function () {
    const testProduct = new product.Product(
        testProductJSON,
        testGlobalJSON,
        i18n
    );

    it("productOwner is parsed correctly", function () {
        assert.strictEqual(
            testProduct.productOwner,
            testProductJSON.productOwner
        );
    });

    it("activeUsers is parsed correctly", function () {
        assert.strictEqual(
            testProduct.activeUsers,
            testProductJSON.activeUsers
        );
    });

    it("productOwnerEnumeration enumerates correctly", function () {
        assert.strictEqual(
            testProduct.productOwnerEnumeration(),
            correctProductOwnerEnumeration
        );
    });
});
