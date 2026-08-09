import { list, put, head } from '@vercel/blob';
import type { Release, ReleasesStore } from './types';

const REGISTRY_KEY = 'registry/releases.json';

export async function getStore(): Promise<ReleasesStore> {
  try {
    const blobs = await list({ prefix: REGISTRY_KEY });
    const match = blobs.blobs.find((b) => b.pathname === REGISTRY_KEY);
    if (!match) return { releases: [] };

    const res = await fetch(match.url, { cache: 'no-store' });
    if (!res.ok) return { releases: [] };
    return (await res.json()) as ReleasesStore;
  } catch {
    return { releases: [] };
  }
}

export async function saveStore(store: ReleasesStore): Promise<void> {
  await put(REGISTRY_KEY, JSON.stringify(store, null, 2), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
  });
}

export async function addRelease(release: Release): Promise<void> {
  const store = await getStore();

  // Remove any existing entry with same version to allow re-uploads
  store.releases = store.releases.filter((r) => r.version !== release.version);

  // Prepend — most recent first
  store.releases.unshift(release);

  await saveStore(store);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
