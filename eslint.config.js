import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Plain Node scripts
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { process: 'readonly', console: 'readonly' } },
  },
  {
    // The game engine must stay pure: no framework, database or I/O imports.
    files: ['server/src/game/engine.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['express', 'express/*', '@prisma/*', 'fs', 'fs/*', 'node:*', 'http', 'https'],
              message: 'The game engine must be pure (no I/O or framework imports).',
            },
          ],
        },
      ],
    },
  },
);
