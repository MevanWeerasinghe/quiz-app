# Frontend Deployment Guide for Vercel

## Changes Made

✅ Created `API_URL` utility in `src/lib/api.ts`  
✅ Updated `.env.local` with `NEXT_PUBLIC_API_URL`  
✅ Replaced all hardcoded `http://localhost:5000` with `API_URL` in all files

## Deployment Steps

### 1. Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy Frontend

Navigate to the frontend folder and deploy:

```bash
cd frontend
vercel
```

Follow the prompts:

- Set up and deploy? **Yes**
- Which scope? Select your account
- Link to existing project? **No**
- Project name? **quiz-app-frontend** (or your preferred name)
- Directory? **./** (press Enter)
- Override settings? **No**

### 4. Set Environment Variables in Vercel

After deployment, go to Vercel Dashboard:

1. Go to your project → **Settings** → **Environment Variables**
2. Add the following variables:

| Variable Name                       | Value                                                     | Environment |
| ----------------------------------- | --------------------------------------------------------- | ----------- |
| `NEXT_PUBLIC_API_URL`               | `https://your-backend.vercel.app`                         | Production  |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_Zml0dGluZy1rb2FsYS03LmNsZXJrLmFjY291bnRzLmRldiQ` | All         |
| `CLERK_SECRET_KEY`                  | `sk_test_FfaX7N3n3cLZnCsakpJlzwN8BwOOGQF9qwfzPKcglT`      | All         |

**Important:** Replace `https://your-backend.vercel.app` with your actual backend URL from the backend deployment.

### 5. Update Backend CORS

After getting your frontend URL (e.g., `https://quiz-app-frontend.vercel.app`):

1. Go to your backend Vercel project → Settings → Environment Variables
2. Add/Update `FRONTEND_URL` with your frontend URL
3. Redeploy backend if needed

### 6. Redeploy Frontend

After setting environment variables:

```bash
vercel --prod
```

## Testing Deployment

1. Visit your frontend URL: `https://your-frontend.vercel.app`
2. Test user authentication (Clerk)
3. Test creating a quiz
4. Test taking a quiz
5. Check browser console for any CORS or API errors

## Troubleshooting

### CORS Errors

- Make sure `FRONTEND_URL` is set correctly in backend
- Verify backend CORS allows your frontend URL

### API Not Working

- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend is deployed and running
- Check Network tab in browser DevTools

### Environment Variables Not Working

- Make sure variable names start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding/changing environment variables
- Clear browser cache

## Local Development

For local development, `.env.local` is configured to use `http://localhost:5000`.

To test with production backend locally:

```bash
# In .env.local
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

## Production URLs

- **Frontend**: `https://your-frontend.vercel.app`
- **Backend**: `https://your-backend.vercel.app`

Remember to update Clerk dashboard with your production URLs for authentication to work properly!
