module.exports = [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        __dirname: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        module: 'readonly',
        require: 'readonly'
      }
    },
    rules: {
      'constructor-super': 'error',
      'no-const-assign': 'error',
      'no-dupe-args': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-func-assign': 'error',
      'no-import-assign': 'error',
      'no-new-native-nonconstructor': 'error',
      'no-obj-calls': 'error',
      'no-setter-return': 'error',
      'no-sparse-arrays': 'error',
      'no-this-before-super': 'error',
      'no-undef': 'error',
      'no-unexpected-multiline': 'error',
      'no-unreachable': 'error',
      'no-unused-vars': 'error',
      'no-useless-backreference': 'error',
      'valid-typeof': 'error'
    }
  }
];
