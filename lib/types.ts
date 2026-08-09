export interface Release {
  version: string;
  buildNumber: number;
  releasedAt: string;       // ISO string
  changelog: string[];
  apkUrl: string;
  apkSize: number;          // bytes
  minAndroid?: string;
}

export interface ReleasesStore {
  releases: Release[];
}
