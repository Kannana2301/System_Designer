# Deploying to GitHub, Render, and Vercel

This repository contains a Next.js frontend and an Express/TypeScript API:

- Deploy `backend` as a Render web service.
- Deploy `frontend` as a Vercel project.

## 1. Push a copy to your GitHub account

Only publish this project if you have the owner's permission. Create a new,
empty GitHub repository (do not initialize it with a README or other files).
From the `System-Designer` directory, point `origin` at that repository and
push the existing `main` branch:

```powershell
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

This replaces the current `origin` URL; it does not delete the friend's
repository. Confirm the new URL with `git remote -v` before pushing. To keep
the original remote as `upstream` instead, use:

```powershell
git remote rename origin upstream
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Never commit `.env` files, API keys, database credentials, or JWT secrets.
The repository's ignore files exclude environment files; keep using those
rules and rotate any credentials that were already exposed.

## 2. Deploy the API on Render

In Render, create a Blueprint from your GitHub repository and use the
`render.yaml` file at the repository root. The Blueprint sets the backend
root directory, build/start commands, Node version, and health-check route.

If you configure the service manually instead, use these settings:

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Build Command | `npm ci --include=dev && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Node Version | `22.x` |

`--include=dev` is required. Render sets `NODE_ENV=production` during the
build, so a plain `npm ci` skips `devDependencies`; without TypeScript, `tsc`
cannot run and `dist/server.js` is never created. That produces:

```
Error: Cannot find module '/opt/render/project/src/backend/dist/server.js'
```

If you see that error, confirm the build command above and check the build log
for `tsc` output before redeploying. If the Render service already exists,
update its **Build Command** in **Settings** (or sync the Blueprint) first;
editing `render.yaml` alone does not change a service that was created
manually.

Set these environment variables in Render (Blueprint: **Environment**):

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | Your MongoDB connection string (required) |
| `MONGODB_DB_NAME` | Optional database name; defaults to `system_designer` |
| `JWT_SECRET` | A long random secret; must be at least 32 characters in production (required) |
| `CLIENT_URL` | The deployed frontend origin, for example `https://your-app.vercel.app` |
| `CLIENT_URLS` | Optional comma-separated extra allowed origins (preview/custom domains) |
| `GEMINI_API_KEY` | Gemini API key; required for AI analysis, roadmap, architecture, and chat |
| `GEMINI_MODEL` | Optional model override, for example `gemini-2.5-flash` |
| `AI_PROVIDER` | Optional: `gemini` (default) |

The backend validates `MONGODB_URI` and `JWT_SECRET` at startup and exits with
an actionable message if either is missing, rather than failing later on the
first request. Generate a secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

`PORT` is assigned by Render automatically. After deploying, confirm the
service responds at `https://YOUR_RENDER_SERVICE.onrender.com/api/health`.

## 3. Deploy the frontend on Vercel or Netlify

For Vercel, import the same GitHub repository and set **Root Directory** to
`frontend`. For Netlify, set the base directory to `frontend` as well; the
repository includes `@netlify/plugin-nextjs`.

Add this environment variable for Production (and Preview if needed):

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | The Render service base URL, without a trailing slash |

`NEXT_PUBLIC_*` values are baked in at build time. After changing this
variable, trigger a new deployment; editing it alone does not update an
already-built site. If the frontend cannot reach the API, logins and project
loading will fail with an "Unable to reach the API" message.

Deploy the frontend, then set Render's `CLIENT_URL` to the deployed frontend
origin exactly (scheme included, no trailing slash) and redeploy the backend.
If you use a custom frontend domain, add it to `CLIENT_URL` or `CLIENT_URLS`.

## 4. Troubleshooting

- **`Cannot find module .../backend/dist/server.js`** – The backend build
  did not run or did not emit `dist`. Use
  `npm ci --include=dev && npm run build` and check that `npm run build`
  succeeds in the Render log.
- **CORS errors in the browser** – Add the exact frontend origin to
  `CLIENT_URL` (or `CLIENT_URLS`) and redeploy the backend.
- **401 errors immediately after opening the dashboard** – You are not signed
  in or the stored token is stale; log in again. The dashboard and project
  pages redirect to `/login` when no token is present.
- **`GEMINI_API_KEY is not configured` in Render logs** – Authentication and
  project CRUD still work, but AI generation is disabled until the key is set.
- **AI generation fails with a model error** – Set `GEMINI_MODEL` to a model
  available to your key (for example `gemini-2.5-flash`).
- **Health check returns 503** – The service is running but MongoDB is not
  connected. Verify `MONGODB_URI`, then check the Atlas IP allowlist.
