class PinnedNotesStore {
	isPinnedNotesModalOpen = $state(false);

	openModal() {
		this.isPinnedNotesModalOpen = true;
	}

	closeModal() {
		this.isPinnedNotesModalOpen = false;
	}
}

export const pinnedNotesStore = new PinnedNotesStore();
