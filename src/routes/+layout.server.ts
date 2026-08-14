import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const disabledCookie = cookies.get('hinix_disabled_features') || '';
	const disabledFeatures = disabledCookie.split(',').filter(Boolean);

	const segment = url.pathname.split('/')[1];

	if (segment && disabledFeatures.includes(segment)) {
		throw redirect(302, '/');
	}

	return {
		disabledFeatures
	};
};
