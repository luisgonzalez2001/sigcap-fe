import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor para agregar el token JWT a las rutas protegidas
type PublicRoute = string | RegExp;
const PUBLIC_ROUTES: PublicRoute[] = [
    /^\/auth\/login/,
    /^\/auth\/signup/,
    /^\/auth\/recover-account/,
    /^\/auth\/reset-password/,
    /^\/auth\/verify/
];

function isPublicRoute(url: string): boolean {
    return PUBLIC_ROUTES.some((route) =>
        typeof route === "string" ? url.startsWith(route) : route.test(url)
    );
}

api.interceptors.request.use((config) => {
    if (config.url && !isPublicRoute(config.url)) {
        // Busca el token en localStorage
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (token) {
            config.headers = config.headers || {};
            config.headers["Authorization"] = `Bearer ${token}`;
        }
    }
    return config;
});

export default api;
