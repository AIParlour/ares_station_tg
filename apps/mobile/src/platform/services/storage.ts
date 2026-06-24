export type StorageService = {
  getPreference(key: string): Promise<string | null>;
  setPreference(key: string, value: string): Promise<void>;
  removePreference(key: string): Promise<void>;
};

/**
 * Temporary shell storage.
 *
 * Phase 3 should replace credentials with SecureStore and preferences with
 * AsyncStorage. Keeping this interface now prevents screens from coupling to a
 * concrete storage SDK before auth and persistence requirements are finalized.
 */
function createMemoryStorage(): StorageService {
  const values = new Map<string, string>();

  return {
    async getPreference(key) {
      return values.get(key) ?? null;
    },
    async setPreference(key, value) {
      values.set(key, value);
    },
    async removePreference(key) {
      values.delete(key);
    },
  };
}

export const storageService = createMemoryStorage();
