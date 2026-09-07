import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	},
	{
		// La frontera que sostiene la separación por cursos: el framework nunca
		// importa de un curso. La única excepción es content/courses.ts, que es
		// el punto de registro y está deliberadamente fuera de esta lista.
		files: [
			'src/lib/ui/**',
			'src/lib/state/**',
			'src/lib/viz/**',
			'src/lib/utils/**',
			'src/lib/content/types.ts',
			'src/routes/**'
		],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['$courses/*', '**/courses/*', '$lib/courses/*'],
							message:
								'El framework no puede importar de un curso. Si lo necesitas, o la pieza es genérica (muévela a $ui/$utils/$viz) o pertenece al curso.'
						}
					]
				}
			]
		}
	}
);
