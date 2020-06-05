import sucrase from "@rollup/plugin-sucrase";

export default {
    input: "src/index.ts",
    output: [
        {
            file: "dist/index.es.js",
            format: "esm"
        },
        {
            file: "dist/index.js",
            format: "cjs"
        }
    ],
    plugins: [
        sucrase({
            exclude: ["node_modules/**"],
            transforms: ["typescript"]
        })
    ],
    external: [
        "@pnpm/read-package-json",
        "fp-ts/lib/Either",
        "fp-ts/lib/pipeable",
        "io-ts/lib/Decoder",
        "io-ts/lib/Tree",
        "path",
        "semver"
    ]
};
