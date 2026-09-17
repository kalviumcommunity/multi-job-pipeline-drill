module.exports = [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 12,
      sourceType: "commonjs",
      globals: {
        __dirname: "readonly",
        module: "readonly",
        require: "readonly",
        process: "readonly",
        console: "readonly",
        jest: "readonly",
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        it: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      }
    },
    rules: {}
  }
];
