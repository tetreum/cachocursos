import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [
		sveltekit({
			preprocess: vitePreprocess(),
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ pages: 'build', assets: 'build', strict: true }),
			alias: {
				$ui: 'src/lib/ui',
				$state: 'src/lib/state',
				$content: 'src/lib/content',
				$viz: 'src/lib/viz',
				$utils: 'src/lib/utils',
				$i18n: 'src/lib/i18n',
				$courses: 'src/lib/courses'
			},
			paths: { base: (process.env.BASE_PATH ?? '') as '' | `/${string}` },
			prerender: {
				handleHttpError: 'fail',
				// Sin cursos registrados, las rutas de curso no se recorren y el
				// prerender estricto fallaría. Quitar un curso no debe romper el build.
				handleUnseenRoutes: 'ignore'
			}
		})
	],
	css: {
		preprocessorOptions: {
			scss: {
				loadPaths: ['src/styles'],
				additionalData: '@use "abstracts" as *;'
			}
		}
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'unit',
					environment: 'node',
					include: ['src/**/*.test.ts'],
					exclude: ['src/**/*.dom.test.ts']
				}
			},
			{
				extends: './vite.config.ts',
				resolve: { conditions: ['browser'] },
				test: {
					name: 'dom',
					environment: 'jsdom',
					include: ['src/**/*.dom.test.ts'],
					setupFiles: ['src/tests/setup.ts']
				}
			}
		]
	}
});
