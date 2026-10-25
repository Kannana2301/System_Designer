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
root directory, build/start commands, and health-check route.

Set these environment variables in Render:

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | Your MongoDB connection string |
| `JWT_SECRET` | A long, random secret used to sign tokens |
| `CLIENT_URL` | The Vercel frontend URL, for example `https://your-app.vercel.app` |
| `GEMINI_API_KEY` or `GROQ_API_KEY` | The API key for the AI provider you intend to use |
| `AI_PROVIDER` | Optional: `gemini` or `groq`; if omitted, the backend chooses based on the available key |

`PORT` is assigned by Render automatically. After deploying, confirm the
service responds at `https://YOUR_RENDER_SERVICE.onrender.com/api/health`.

## 3. Deploy the frontend on Vercel

Import the same GitHub repository into Vercel and set **Root Directory** to
`frontend`. Vercel detects Next.js and uses the existing build script.

Add this environment variable in Vercel for Production (and Preview if needed):

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | The Render service base URL, without a trailing slash |

Deploy the frontend, then set Render's `CLIENT_URL` to the deployed frontend
URL and redeploy the backend. If you use a custom frontend domain, set
`CLIENT_URL` to that exact origin as well.
