# SiddhiBoys — frontend

React + Vite + Tailwind. See the main [README](../README.md) for setup and deployment.

```bash
npm install
npm run dev            # http://localhost:5173 (API calls go to localhost:5001 through the Vite proxy)
npm run build          # production build in dist/
```

Vite reads variables from the root `.env` file. For a deployed build set `VITE_API_URL`
(e.g. `https://your-api.example.com/api`) in the hosting platform.
