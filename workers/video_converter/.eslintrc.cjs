module.exports = {
    extends: 'airbnb-base',
    parser: 'babel-eslint',
    parserOptions: {
        ecmaVersion: 11,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
            modules: true,
            experimentalObjectRestSpread: true,
        },
    },
    rules: {
        'no-unused-expressions': ['error', { allowShortCircuit: true }],
        'lines-between-class-members': 'off',
        'import/extensions': ['error', 'always', { ignorePackages: true }],
        'import/no-named-as-default-member': 'off',
        'import/prefer-default-export': 'off',
        'no-console': 'off',
        'guard-for-in': 'off',
        'consistent-return': 'off',
        'no-restricted-syntax': 'off',
        'import/no-cycle': 'off',
        camelcase: 'off',
        'no-param-reassign': 'off',
        'no-plusplus': 'off',
        'no-shadow': 'off',
        'no-prototype-builtins': 'off',
        'no-unused-vars': 'off',
        'no-use-before-define': [
            'error',
            {
                functions: false,
                classes: true,
            },
        ],
        'max-len': [
            'error',
            {
                code: 160,
            },
        ],
        indent: [
            'error',
            4,
        ],
        semi: [
            'error',
            'never',
        ],
        'no-multiple-empty-lines': [
            'error',
            {
                max: 2,
                maxEOF: 1,
                maxBOF: 0,
            },
        ],
        'max-classes-per-file': 'off',
    },
}
