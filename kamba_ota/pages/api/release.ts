import type { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';
import formidable, { File } from 'formidable';
import fs from 'fs';
import { addRelease } from '../../lib/store';
import type { Release } from '../../lib/types';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const expected = process.env.UPLOAD_SECRET ?? '';

  if (!expected) {
    return res.status(500).json({ error: 'Server misconfiguration: UPLOAD_SECRET not set.' });
  }
  if (token !== expected) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  // ── Parse multipart form ──────────────────────────────────────────────────
  const form = formidable({ maxFileSize: 200 * 1024 * 1024 }); // 200 MB limit

  let fields: formidable.Fields;
  let files: formidable.Files;

  try {
    [fields, files] = await form.parse(req);
  } catch (err) {
    return res.status(400).json({ error: 'Failed to parse form data.' });
  }

  const version   = Array.isArray(fields.version)     ? fields.version[0]     : fields.version;
  const build     = Array.isArray(fields.build)        ? fields.build[0]       : fields.build;
  const changelog = Array.isArray(fields.changelog)    ? fields.changelog[0]   : fields.changelog;
  const minAndroid = Array.isArray(fields.min_android) ? fields.min_android[0] : fields.min_android;

  if (!version || !changelog) {
    return res.status(400).json({ error: 'Required fields: version, changelog.' });
  }

  const apkFile = files.apk
    ? (Array.isArray(files.apk) ? files.apk[0] : files.apk)
    : null;

  if (!apkFile) {
    return res.status(400).json({ error: 'Required field: apk (binary file).' });
  }

  // ── Upload APK to Blob storage ────────────────────────────────────────────
  const filename  = `releases/kamba-farma-${version}.apk`;
  const fileBuffer = fs.readFileSync((apkFile as File).filepath);

  let apkUrl: string;
  try {
    const blob = await put(filename, fileBuffer, {
      access: 'public',
      contentType: 'application/vnd.android.package-archive',
      allowOverwrite: true,
    });
    apkUrl = blob.url;
  } catch (err) {
    console.error('[release] blob upload error', err);
    return res.status(500).json({ error: 'Failed to upload APK.' });
  }

  // ── Parse changelog lines (newline-separated) ─────────────────────────────
  const changelogLines = (changelog as string)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // ── Register release ──────────────────────────────────────────────────────
  const release: Release = {
    version:      version as string,
    buildNumber:  build ? parseInt(build as string, 10) : Date.now(),
    releasedAt:   new Date().toISOString(),
    changelog:    changelogLines,
    apkUrl,
    apkSize:      (apkFile as File).size,
    minAndroid:   (minAndroid as string | undefined) ?? undefined,
  };

  try {
    await addRelease(release);
  } catch (err) {
    console.error('[release] store error', err);
    return res.status(500).json({ error: 'Failed to update release registry.' });
  }

  return res.status(201).json({
    ok: true,
    version: release.version,
    apkUrl:  release.apkUrl,
    size:    release.apkSize,
  });
}
