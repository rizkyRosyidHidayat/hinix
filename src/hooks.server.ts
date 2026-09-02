import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// 1. Grab the theme cookie (default to 'system' if missing)
	const theme = event.cookies.get('hinix_theme') || 'system';

	// 2. Inject a custom class or data-attribute into the %sveltekit.html% root
	return await resolve(event, {
		transformPageChunk: ({ html }) =>
			html.replace('%hinix_theme%', theme === 'system' ? 'dark' : theme)
	});
};
