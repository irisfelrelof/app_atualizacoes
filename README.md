# Kamba Farma OTA

Site de distribuicao de actualizacoes do Kamba Farma, hospedado na Vercel.

---

## Estrutura

```
pages/
  index.tsx          — pagina publica (changelog + download)
  api/
    release.ts       — endpoint de upload (autenticado)
lib/
  store.ts           — leitura/escrita do registo de versoes (Vercel Blob)
  types.ts           — tipos TypeScript
styles/
  globals.css
  Home.module.css
```

---

## Deploy na Vercel

### 1. Criar repositorio e fazer push

```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/TU/kamba-ota.git
git push -u origin main
```

### 2. Importar o projecto na Vercel

Vai a https://vercel.com/new e importa o repositorio.

### 3. Adicionar Vercel Blob Storage

No dashboard do projecto:
Storage → Create Database → Blob → criar

A variavel `BLOB_READ_WRITE_TOKEN` e adicionada automaticamente.

### 4. Definir variaveis de ambiente

No dashboard: Settings → Environment Variables

| Nome            | Valor                             |
|-----------------|-----------------------------------|
| `UPLOAD_SECRET` | password forte (min. 32 caracteres) |

Gera uma boa password com:
```bash
openssl rand -hex 32
```

### 5. Fazer redeploy

Apos adicionar as variaveis, faz redeploy para as aplicar.

---

## Publicar uma nova versao via curl

```bash
curl -X POST https://SEU-SITE.vercel.app/api/release \
  -H "Authorization: Bearer SUA_PASSWORD" \
  -F "version=1.2.0" \
  -F "build=42" \
  -F "min_android=8.0" \
  -F "changelog=Correccao do modulo de vendas
Melhoria de desempenho no ecra principal
Suporte a impressao Bluetooth em Android 13" \
  -F "apk=@/caminho/para/kamba-farma.apk"
```

### Campos do formulario

| Campo         | Obrigatorio | Descricao                                      |
|---------------|-------------|------------------------------------------------|
| `version`     | Sim         | Ex: `1.2.0`                                    |
| `build`       | Nao         | Numero de build (inteiro)                      |
| `min_android` | Nao         | Ex: `8.0 (Oreo)`                               |
| `changelog`   | Sim         | Uma linha por alteracao, separadas por `\n`    |
| `apk`         | Sim         | Ficheiro `.apk`                                |

### Resposta de sucesso (201)

```json
{
  "ok": true,
  "version": "1.2.0",
  "apkUrl": "https://...vercel-storage.com/releases/kamba-farma-1.2.0.apk",
  "size": 28311552
}
```

---

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local
# preenche BLOB_READ_WRITE_TOKEN e UPLOAD_SECRET no .env.local
npm run dev
```

O site corre em http://localhost:3000
