import shiny from 'eslint-config-shiny'

export default [
  ...(await shiny({ configs: ['node', 'format', 'vitest'] })),
  {
    rules: {
      'no-underscore-dangle': 0,
      'no-promise-executor-return': 0,
      'promise/catch-or-return': 0,
      'promise/prefer-await-to-then': 0,
      'promise/avoid-new': 0,
      'unicorn/no-thenable': 0,
      'ts/no-unnecessary-template-expression': 0,
      'unicorn/no-null': 0,
      'unicorn/prefer-at': 0,
      'n/callback-return': 0
    }
  }
]
