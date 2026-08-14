import { db } from '../db/database';

export type FeatureSettings = {
  todo: boolean;
  budget: boolean;
  schedule: boolean;
  calculator: boolean;
  timer: boolean;
  notes: boolean;
};

class SettingsStore {
  features = $state<FeatureSettings>({
    todo: true,
    budget: false,
    schedule: true,
    calculator: true,
    timer: true,
    notes: true
  });

  isLoaded = $state(false);

  async load() {
    if (this.isLoaded) return;
    try {
      if (db) {
        const settings = await db.settings.toArray();
        for (const setting of settings) {
          if (setting.id.startsWith('feature_')) {
            const feature = setting.id.replace('feature_', '') as keyof FeatureSettings;
            if (feature in this.features) {
              this.features[feature] = setting.value as boolean;
            }
          }
        }
        this.syncCookie();
      }
    } catch (e) {
      console.warn('Failed to load settings', e);
    }
    this.isLoaded = true;
  }

  async toggleFeature(feature: keyof FeatureSettings, enabled?: boolean) {
    const newValue = enabled ?? !this.features[feature];
    this.features[feature] = newValue;
    try {
      if (db) {
        await db.settings.put({ id: `feature_${feature}`, value: newValue });
      }
      this.syncCookie();
    } catch (e) {
      console.error(`Failed to save setting feature_${feature}`, e);
    }
  }

  private syncCookie() {
    if (typeof document !== 'undefined') {
      const disabledFeatures = Object.entries(this.features)
        .filter(([_, isEnabled]) => !isEnabled)
        .map(([key]) => key);
      document.cookie = `hinix_disabled_features=${disabledFeatures.join(',')}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }
}

export const settingsStore = new SettingsStore();
