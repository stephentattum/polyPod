module.exports = {
    extends: [
        "eslint:recommended",
        "plugin:prettier/recommended"
    ],
    parserOptions: {
        ecmaVersion: 6
    },
    rules: {
        semi: 2
    },
    overrides: [
        {
            files: ["*.ts"],
            extends: [
                "plugin:@typescript-eslint/eslint-recommended",
                "plugin:@typescript-eslint/recommended",
                "prettier/@typescript-eslint",
            ],
            parser: "@typescript-eslint/parser",
            plugins: ["@typescript-eslint"],
            rules: {
                "@typescript-eslint/camelcase": "off",
                "@typescript-eslint/no-explicit-any": "off",
                "@typescript-eslint/no-non-null-assertion": "off",
                "@typescript-eslint/ban-ts-comment": "off",
                "@typescript-eslint/explicit-function-return-type": [
                    "error",
                    {
                        allowExpressions: true
                    }
                ],
                "@typescript-eslint/no-this-alias": "off",
                "no-unused-vars": "off",
                "@typescript-eslint/no-unused-vars": ["warn"],
            },
        }
    ]
};
