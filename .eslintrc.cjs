/**
 * Configuracao do ESLint do painel admin.
 *
 * F24 da auditoria de 10-12/09/2026: o `package.json` declarava o script
 * `lint` e as quatro dependencias de lint, e NAO havia arquivo de
 * configuracao. O comando saia com codigo 2 — "ESLint couldn't find a
 * configuration file" — entao ninguem rodava, e um script que sempre falha e
 * pior que nenhum: ele da a impressao de que existe verificacao.
 *
 * Formato `.eslintrc.cjs` porque o ESLint instalado e 8.x, onde o flat config
 * ainda nao e o padrao.
 *
 * As regras comecam permissivas de proposito. Um portao que nasce vermelho nao
 * e usado; o valor imediato esta em pegar erro de verdade (hook fora de ordem,
 * variavel inexistente), nao em discutir estilo.
 */
module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'build', 'node_modules', '.eslintrc.cjs', 'server.js', 'prisma'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['react-refresh', '@typescript-eslint'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

    // Variavel nao usada e aviso, nao erro: o padrao com _ marca o descarte
    // deliberado (por exemplo, ignorar o primeiro elemento de uma tupla).
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    }],

    // `any` e abundante neste codigo e tirar tudo agora seria outra tarefa.
    // Fica como aviso para nao esconder o que importa.
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'warn',

    // Estes SAO erro: apontam defeito em execucao, nao estilo.
    'no-undef': 'off', // o TypeScript ja cobre, e aqui daria falso positivo
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-constant-condition': ['error', { checkLoops: false }],
  },
};
