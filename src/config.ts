/**
 * Configuración del Frontend de SIGCAP
 * 
 * Las variables de entorno se configuran en:
 * - Local: .env (copia de .env.example)
 * - Vercel: Variables de entorno en el dashboard
 */

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const NEXT_PUBLIC_NOTIFICATIONS_URL = process.env.NEXT_PUBLIC_NOTIFICATIONS_URL || '';
const NEXT_PUBLIC_NOTIFICATIONS_API = process.env.NEXT_PUBLIC_NOTIFICATIONS_API || '';
const NEXT_PUBLIC_ENV = process.env.NEXT_PUBLIC_ENV || 'development';

// Validar variables solo en runtime del cliente, no durante build
if (typeof window !== 'undefined') {
    if (!NEXT_PUBLIC_API_URL) {
        console.error('[Config] ⚠️ NEXT_PUBLIC_API_URL no está configurada');
    }
}

const config = {
    NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_NOTIFICATIONS_URL,
    NEXT_PUBLIC_NOTIFICATIONS_API,
    NEXT_PUBLIC_ENV,
    isProduction: NEXT_PUBLIC_ENV === 'production',
    isTesting: NEXT_PUBLIC_ENV === 'testing',
    isDevelopment: NEXT_PUBLIC_ENV === 'development',
};

export default config;