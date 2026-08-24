import { browser } from '$app/environment';

class SupportStore {
	isSupportModalOpen = $state(false);

	init() {
		if (!browser) return;

		const firstVisit = localStorage.getItem('hinix_first_visit');
		const hasShown = localStorage.getItem('hinix_support_shown');

		if (!firstVisit) {
			localStorage.setItem('hinix_first_visit', Date.now().toString());
		} else if (!hasShown) {
			const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
			const timeElapsed = Date.now() - parseInt(firstVisit, 10);

			if (timeElapsed >= threeDaysInMs) {
				this.isSupportModalOpen = true;
				localStorage.setItem('hinix_support_shown', 'true');
			}
		}
	}

	closeModal() {
		this.isSupportModalOpen = false;
	}
}

export const supportStore = new SupportStore();
