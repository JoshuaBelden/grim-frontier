module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:react/jsx-runtime",
        "plugin:react-hooks/recommended",
    ],
    ignorePatterns: ["dist", ".eslintrc.cjs"],
    parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    settings: { react: { version: "18.2" } },
    plugins: ["react-refresh"],
    rules: {
        "react/jsx-no-target-blank": "off",
        "react-refresh/only-export-components": [
            "warn",
            { allowConstantExport: true },
        ],
        indent: ["error", 4], // Use 4 spaces for indentation
        "react/jsx-indent": ["error", 4], // Use 4 spaces for JSX indentation
        "react/jsx-indent-props": ["error", 4], // Use 4 spaces for JSX props indentation
        "arrow-parens": ["error", "as-needed"],
    },
}
