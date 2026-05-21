import { defineConfig } from "oxlint";

// FIXME: These rules should probably be re-enabled eventually
const temporarilyDisabled = ["typescript/no-dynamic-delete"];

const disabledRules = [
    ...temporarilyDisabled,
    "eslint/arrow-body-style",
    "eslint/id-length",
    "eslint/init-declarations",
    "eslint/max-lines-per-function",
    "eslint/max-lines",
    "eslint/max-params",
    "eslint/max-statements",
    "eslint/no-console",
    "eslint/no-continue",
    "eslint/no-eq-null",
    "eslint/no-lonely-if",
    "eslint/no-magic-numbers",
    "eslint/no-negated-condition",
    "eslint/no-plusplus",
    "eslint/no-shadow",
    "eslint/no-ternary",
    "eslint/no-undefined",
    "eslint/no-underscore-dangle",
    "eslint/no-use-before-define",
    "eslint/prefer-destructuring",
    "eslint/sort-imports",
    "eslint/sort-keys",
    "eslint/sort-vars",
    "func-style",
    "import/exports-last",
    "import/group-exports",
    "import/max-dependencies",
    "import/no-named-export",
    "import/no-nodejs-modules",
    "import/no-relative-parent-imports",
    "import/prefer-default-export",
    "oxc/no-async-await",
    "oxc/no-map-spread",
    "oxc/no-optional-chaining",
    "oxc/no-rest-spread-properties",
    "promise/always-return",
    "promise/avoid-new",
    "promise/prefer-await-to-callbacks",
    "promise/prefer-await-to-then",
    "react-perf/jsx-no-new-function-as-prop",
    "react-perf/jsx-no-new-object-as-prop",
    "react/exhaustive-deps",
    "react/forbid-component-props",
    "react/jsx-max-depth",
    "react/no-multi-comp",
    "react/react-in-jsx-scope",
    "typescript/explicit-function-return-type",
    "typescript/parameter-properties",
    "typescript/prefer-readonly-parameter-types",
    "unicorn/filename-case",
    "unicorn/no-negated-condition",
    "unicorn/no-null",
    "unicorn/no-useless-undefined",
    "unicorn/prefer-at",
    "unicorn/prefer-module",
    "unicorn/prefer-query-selector",
    "unicorn/prefer-spread",
];

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
    ignorePatterns: ["/docs", "*.d.ts"],
    options: {
        typeAware: true,
        typeCheck: true,
    },
    env: {
        node: true,
        browser: true,
    },
    plugins: [
        "eslint",
        "typescript",
        "unicorn",
        "oxc",
        "import",
        "node",
        "promise",
        "react",
        "react-perf",
    ],
    categories: {
        correctness: "warn",
        suspicious: "warn",
        pedantic: "warn",
        perf: "warn",
        style: "warn",
        restriction: "warn",
        nursery: "warn",
    },
    rules: {
        ...Object.fromEntries(disabledRules.map((r) => [r, "off"])),
        "eslint/no-duplicate-imports": [
            "warn",
            {
                allowSeparateTypeImports: true,
            },
        ],
        "eslint/no-restricted-imports": [
            "warn",
            {
                paths: [
                    {
                        name: "node:assert",
                        message: "Use node:assert/strict instead",
                    },
                ],
            },
        ],
        "eslint/no-unused-vars": [
            "warn",
            {
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_",
            },
        ],
        "import/no-unassigned-import": [
            "warn",
            {
                allow: ["**/*.css", "**/*.scss"],
            },
        ],
        "no-warning-comments": [
            "warn",
            {
                terms: ["todo"],
            },
        ],
        "react/jsx-filename-extension": [
            "warn",
            {
                extensions: [".tsx"],
            },
        ],
        "react/jsx-pascal-case": [
            "warn",
            {
                allowAllCaps: true,
            },
        ],
        "react/no-unknown-property": [
            "warn",
            {
                ignore: ["onDblClick"],
            },
        ],
        "typescript/no-confusing-void-expression": [
            "warn",
            {
                ignoreArrowShorthand: true,
            },
        ],
        "typescript/no-invalid-void-type": [
            "warn",
            {
                allowAsThisParameter: true,
            },
        ],
        "typescript/strict-boolean-expressions": [
            "warn",
            {
                allowNullableBoolean: true,
            },
        ],
        eqeqeq: [
            "warn",
            "always",
            {
                null: "never",
            },
        ],
    },
});
