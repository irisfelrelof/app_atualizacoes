import { useState, type FormEvent } from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { getStore, formatBytes } from '../lib/store';
import type { Release } from '../lib/types';
import styles from '../styles/Home.module.css';

interface Props {
  latest: Release | null;
  previous: Release[];
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const store = await getStore();
  const [latest = null, ...previous] = store.releases;
  return { props: { latest, previous } };
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function VersionBadge({ version }: { version: string }) {
  return <span className={styles.versionBadge}>{version}</span>;
}

const Home: NextPage<Props> = ({ latest, previous }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  async function handleUploadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage('');
    const form = event.currentTarget;
    const formData = new FormData(form);

    setUploading(true);
    try {
      const res = await fetch('/api/release', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Falha ao enviar a atualização.');
      }

      setStatusMessage(`Atualização enviada: versão ${data.version}`);
      form.reset();
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? `Erro: ${error.message}` : 'Erro inesperado.'
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Kamba Farma — Actualizacoes</title>
        <meta name="description" content="Transfere a versao mais recente do Kamba Farma para Android." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.root}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.logo}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <rect width="28" height="28" rx="6" fill="#2563EB" />
                <path d="M7 14h14M14 7v14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span>Kamba Farma</span>
            </div>
            <span className={styles.headerTag}>Canal de Distribuicao</span>
          </div>
        </header>

        <main className={styles.main}>
          {latest ? (
            <>
              {/* ── Hero ── */}
              <section className={styles.hero}>
                <div className={styles.heroMeta}>
                  <span className={styles.eyebrow}>Versao actual</span>
                  <h1 className={styles.versionNumber}>{latest.version}</h1>
                  <div className={styles.heroStats}>
                    <span className={styles.stat}>
                      <span className={styles.statLabel}>Publicada em</span>
                      <span className={styles.statValue}>{formatDate(latest.releasedAt)}</span>
                    </span>
                    <span className={styles.statDivider} />
                    <span className={styles.stat}>
                      <span className={styles.statLabel}>Tamanho</span>
                      <span className={styles.statValue}>{formatBytes(latest.apkSize)}</span>
                    </span>
                    {latest.minAndroid && (
                      <>
                        <span className={styles.statDivider} />
                        <span className={styles.stat}>
                          <span className={styles.statLabel}>Android minimo</span>
                          <span className={styles.statValue}>{latest.minAndroid}</span>
                        </span>
                      </>
                    )}
                    {latest.buildNumber && (
                      <>
                        <span className={styles.statDivider} />
                        <span className={styles.stat}>
                          <span className={styles.statLabel}>Build</span>
                          <span className={styles.statValue}>#{latest.buildNumber}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className={styles.heroActions}>
                  <a
                    href={latest.apkUrl}
                    className={styles.downloadBtn}
                    download={`KambaFarma-${latest.version}.apk`}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M10 3v10M6 9l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 15h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    </svg>
                    Transferir APK
                  </a>

                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => setShowUpload((current) => !current)}
                  >
                    {showUpload ? 'Fechar upload' : 'Subir atualização'}
                  </button>
                </div>
              </section>

              {showUpload && (
                <section className={styles.uploadSection}>
                  <div className={styles.uploadCard}>
                    <div className={styles.uploadHeader}>
                      <h2 className={styles.sectionTitle}>Enviar nova atualização</h2>
                      <p className={styles.uploadNote}>
                        Preencha os campos abaixo e envie um novo APK para substituir a versão atual.
                      </p>
                    </div>

                    <form className={styles.uploadForm} onSubmit={handleUploadSubmit}>
                      <div className={styles.formGrid}>
                        <label className={styles.formGroup}>
                          <span>Versão</span>
                          <input name="version" type="text" required className={styles.input} placeholder="1.2.3" />
                        </label>

                        <label className={styles.formGroup}>
                          <span>Build</span>
                          <input name="build" type="text" className={styles.input} placeholder="123" />
                        </label>
                      </div>

                      <div className={styles.formGrid}>
                        <label className={styles.formGroup}>
                          <span>Android mínimo</span>
                          <input name="min_android" type="text" className={styles.input} placeholder="Android 7.0" />
                        </label>

                        <label className={styles.formGroup}>
                          <span>APK</span>
                          <input name="apk" type="file" accept=".apk" required className={styles.fileInput} />
                        </label>
                      </div>

                      <label className={styles.formGroup}>
                        <span>Changelog</span>
                        <textarea
                          name="changelog"
                          required
                          className={styles.textarea}
                          placeholder="- Nova funcionalidade X\n- Correção no Y"
                        />
                      </label>

                      <button type="submit" className={styles.submitBtn} disabled={uploading}>
                        {uploading ? 'Enviando...' : 'Enviar atualização'}
                      </button>

                      {statusMessage && (
                        <p className={styles.statusMessage}>{statusMessage}</p>
                      )}
                    </form>
                  </div>
                </section>
              )}

              {/* ── Changelog da versao actual ── */}
              <section className={styles.changelogSection}>
                <h2 className={styles.sectionTitle}>O que mudou</h2>
                <div className={styles.card}>
                  <ul className={styles.changelogList}>
                    {latest.changelog.map((line, i) => (
                      <li key={i} className={styles.changelogItem}>
                        <span className={styles.changelogDot} />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* ── Versoes anteriores ── */}
              {previous.length > 0 && (
                <section className={styles.historySection}>
                  <h2 className={styles.sectionTitle}>Versoes anteriores</h2>
                  <div className={styles.timeline}>
                    {previous.map((rel) => (
                      <div key={rel.version} className={styles.timelineItem}>
                        <div className={styles.timelineHeader}>
                          <VersionBadge version={rel.version} />
                          <span className={styles.timelineDate}>{formatDate(rel.releasedAt)}</span>
                          <a
                            href={rel.apkUrl}
                            className={styles.timelineDownload}
                            download={`KambaFarma-${rel.version}.apk`}
                            title={`Transferir versao ${rel.version}`}
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                              <path d="M10 3v10M6 9l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M3 15h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                            </svg>
                            {formatBytes(rel.apkSize)}
                          </a>
                        </div>
                        <ul className={styles.changelogListSmall}>
                          {rel.changelog.map((line, i) => (
                            <li key={i} className={styles.changelogItemSmall}>
                              <span className={styles.changelogDotSmall} />
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <section className={styles.empty}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setShowUpload((current) => !current)}
              >
                {showUpload ? 'Fechar upload' : 'Subir atualização'}
              </button>

              {showUpload && (
                <div className={styles.uploadSection}>
                  <div className={styles.uploadCard}>
                    <div className={styles.uploadHeader}>
                      <h2 className={styles.sectionTitle}>Enviar nova atualização</h2>
                      <p className={styles.uploadNote}>
                        Preencha os campos abaixo e envie o primeiro APK do app.
                      </p>
                    </div>

                    <form className={styles.uploadForm} onSubmit={handleUploadSubmit}>
                      <div className={styles.formGrid}>
                        <label className={styles.formGroup}>
                          <span>Versão</span>
                          <input name="version" type="text" required className={styles.input} placeholder="1.0.0" />
                        </label>

                        <label className={styles.formGroup}>
                          <span>Build</span>
                          <input name="build" type="text" className={styles.input} placeholder="123" />
                        </label>
                      </div>

                      <div className={styles.formGrid}>
                        <label className={styles.formGroup}>
                          <span>Android mínimo</span>
                          <input name="min_android" type="text" className={styles.input} placeholder="Android 7.0" />
                        </label>

                        <label className={styles.formGroup}>
                          <span>APK</span>
                          <input name="apk" type="file" accept=".apk" required className={styles.fileInput} />
                        </label>
                      </div>

                      <label className={styles.formGroup}>
                        <span>Changelog</span>
                        <textarea
                          name="changelog"
                          required
                          className={styles.textarea}
                          placeholder="- Nova funcionalidade X\n- Correção no Y"
                        />
                      </label>

                      <button type="submit" className={styles.submitBtn} disabled={uploading}>
                        {uploading ? 'Enviando...' : 'Enviar atualização'}
                      </button>

                      {statusMessage && (
                        <p className={styles.statusMessage}>{statusMessage}</p>
                      )}
                    </form>
                  </div>
                </div>
              )}

              <p className={styles.emptyTitle}>Nenhuma versao disponivel</p>
              <p className={styles.emptyDesc}>
                O primeiro APK ainda nao foi publicado. Volte em breve.
              </p>
            </section>
          )}
        </main>

        <footer className={styles.footer}>
          <span>Kamba Farma — Sistema de Gestao de Farmacias</span>
          <span className={styles.footerDivider}>|</span>
          <span>Distribuicao restrita</span>
        </footer>
      </div>
    </>
  );
};

export default Home;
