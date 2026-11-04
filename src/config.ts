// Backend URL. Override by creating a .env file with: VITE_API_URL=http://localhost:5000
export const API_URL: string =
    import.meta.env.VITE_API_URL ?? "http://localhost:5000";
