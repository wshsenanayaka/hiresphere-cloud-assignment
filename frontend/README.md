# HireSphere React Frontend

## Folder Structure

```text
frontend/src/
  main.jsx                 # React bootstrap
  App.jsx                  # Backward-compatible app export
  app/
    App.jsx                # Application shell and top-level state
  api/
    client.js              # Shared fetch wrapper
    hireSphereApi.js       # Backend endpoint methods
    mappers.js             # API response mapping helpers
  data/
    mockData.js            # Static filter options and fallback data
  features/
    auth/                  # Authentication screen
    candidate/             # Candidate dashboard and history UI
    interviewer/           # Interviewer dashboard UI
  layouts/
    Sidebar.jsx            # App layout/sidebar components
  shared/
    components/            # Reusable UI components
  styles.css               # Global stylesheet
```

## Run

```bash
npm run dev
```

The frontend uses `VITE_API_URL` from `frontend/.env` and falls back to `http://localhost:5000`.
