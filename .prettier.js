export default {
  $schema: "https://json.schemastore.org/prettierrc",
  arrowParens: "always",
  bracketSpacing: true,
  endOfLine: "lf",
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  overrides: [
    {
      files: "*.md",
      options: {
        proseWrap: "preserve",
      },
    },
  ],
  printWidth: 100,
  proseWrap: "never",
  quoteProps: "consistent",
  singleQuote: true,
  tabWidth: 2,
  trailingComma: "all",
  useTabs: false,
};
