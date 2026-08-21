import { browser } from '$app/environment';
import type { SyncStatus } from '../sync/sync.types';
import { db } from '../db/database';

class SyncStore {
  status = $state<SyncStatus>('idle');
  scriptUrl = $state<string>('');
  enabled = $state<boolean>(false);
  lastSyncAt = $state<string | null>(null);
  isLoaded = $state(false);

  async load() {
    if (this.isLoaded) return;
    if (browser && db) {
      const urlSetting = await db.settings.get('syncUrl');
      const enabledSetting = await db.settings.get('syncEnabled');
      const lastSyncSetting = await db.settings.get('lastSyncAt');
      
      if (urlSetting) this.scriptUrl = urlSetting.value as string;
      if (enabledSetting) this.enabled = enabledSetting.value as boolean;
      if (lastSyncSetting) this.lastSyncAt = lastSyncSetting.value as string;
    }
    this.isLoaded = true;
  }

  async setScriptUrl(url: string) {
    this.scriptUrl = url;
    if (browser && db) {
      await db.settings.put({ id: 'syncUrl', value: url });
    }
  }

  async setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (browser && db) {
      await db.settings.put({ id: 'syncEnabled', value: enabled });
    }
  }

  setStatus(status: SyncStatus) {
    this.status = status;
  }

  async updateLastSync() {
    const now = new Date().toISOString();
    this.lastSyncAt = now;
    if (browser && db) {
      await db.settings.put({ id: 'lastSyncAt', value: now });
    }
  }
}

export const syncStore = new SyncStore();
