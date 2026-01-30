"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import {
  saveAuthData,
  saveSocioExtra,
  clearAuthData,
  getUser,
  getSocioExtra,
  getAccessToken,
  getRefreshToken,
  updateTokens,
  isAuthenticated as checkIsAuthenticated,
  onLogoutBroadcast,
  broadcastLogout,
  updateUser,
  type SocioExtra,
} from "@/utils/auth.utils";
import type {
  UserResponse,
  LoginResponse,
  RefreshResponse,
  ValidateResponse,
} from "@/types/Auth";

// ==================== CONFIGURACIÓN ====================

const INACTIVITY_TIMEOUT = 55 * 60 * 1000; // 55 minutos (antes de que expire el refresh token de 60 min)
const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000; // Verificar token cada 5 minutos
const INACTIVITY_WARNING_TIME = 5 * 60 * 1000; // Mostrar warning 5 minutos antes

// ==================== INTERFACES ====================

interface AuthContextProps {
  user: UserResponse | null;
  socioExtra: SocioExtra | null;
  isLoading: boolean;
  loadingPartner: boolean;
  isAuthenticated: boolean;
  showInactivityWarning: boolean;
  login: (loginResponse: LoginResponse) => Promise<void>;
  logout: () => void;
  setUser: (user: UserResponse | null) => void;
  setSocioExtra: (extra: SocioExtra | null) => void;
  refreshUserData: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  validateToken: () => Promise<boolean>;
  extendSession: () => void;
}

// ==================== CONTEXT ====================

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// ==================== PROVIDER ====================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserResponse | null>(null);
  const [socioExtra, setSocioExtraState] = useState<SocioExtra | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPartner, setLoadingPartner] = useState(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const router = useRouter();

  // Refs para timers de inactividad
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tokenCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Verificar si está autenticado
  const isAuthenticated = !!user && checkIsAuthenticated();

  // ==================== VALIDATE TOKEN ====================

  const validateToken = useCallback(async (): Promise<boolean> => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const { data } = await api.get<ValidateResponse>("/auth/validate");
      return data.valid === true;
    } catch {
      return false;
    }
  }, []);

  // ==================== REFRESH TOKEN ====================

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const currentRefreshToken = getRefreshToken();
    if (!currentRefreshToken) return false;

    try {
      const { data } = await api.post<RefreshResponse>("/auth/refresh", {
        refreshToken: currentRefreshToken,
      });
      updateTokens(data);
      return true;
    } catch {
      return false;
    }
  }, []);

  // ==================== RESET INACTIVITY TIMERS ====================

  const resetInactivityTimers = useCallback(() => {
    // Limpiar timers existentes
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    // Ocultar warning si está visible
    setShowInactivityWarning(false);

    // Actualizar tiempo de última actividad
    lastActivityRef.current = Date.now();

    // Solo configurar timers si está autenticado
    if (!checkIsAuthenticated()) return;

    // Timer para mostrar warning antes de expirar
    warningTimerRef.current = setTimeout(() => {
      setShowInactivityWarning(true);
    }, INACTIVITY_TIMEOUT - INACTIVITY_WARNING_TIME);

    // Timer para logout por inactividad
    inactivityTimerRef.current = setTimeout(() => {
      console.log("Sesión expirada por inactividad");
      clearAuthData();
      broadcastLogout();
      setUserState(null);
      setSocioExtraState(null);
      setShowInactivityWarning(false);
      router.push("/auth/login?reason=inactivity");
    }, INACTIVITY_TIMEOUT);
  }, [router]);

  // ==================== EXTEND SESSION ====================

  const extendSession = useCallback(async () => {
    setShowInactivityWarning(false);

    // Intentar refresh del token para extender la sesión
    const success = await refreshToken();
    if (success) {
      resetInactivityTimers();
    } else {
      // Si falla el refresh, hacer logout
      clearAuthData();
      broadcastLogout();
      setUserState(null);
      setSocioExtraState(null);
      router.push("/auth/login?reason=session_expired");
    }
  }, [refreshToken, resetInactivityTimers, router]);

  // ==================== SETUP ACTIVITY LISTENERS ====================

  useEffect(() => {
    if (!isAuthenticated) return;

    const activityEvents = [
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "mousemove",
    ];

    // Throttle para no resetear en cada pequeño movimiento
    let throttleTimeout: NodeJS.Timeout | null = null;

    const handleActivity = () => {
      if (throttleTimeout) return;

      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
        resetInactivityTimers();
      }, 1000); // Throttle de 1 segundo
    };

    // Agregar listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Iniciar timers
    resetInactivityTimers();

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [isAuthenticated, resetInactivityTimers]);

  // ==================== TOKEN VALIDATION INTERVAL ====================

  useEffect(() => {
    if (!isAuthenticated) {
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
      }
      return;
    }

    // Verificar token periódicamente
    tokenCheckIntervalRef.current = setInterval(async () => {
      const isValid = await validateToken();
      if (!isValid) {
        // Intentar refresh
        const refreshed = await refreshToken();
        if (!refreshed) {
          // Token completamente expirado
          clearAuthData();
          broadcastLogout();
          setUserState(null);
          setSocioExtraState(null);
          router.push("/auth/login?reason=session_expired");
        }
      }
    }, TOKEN_CHECK_INTERVAL);

    return () => {
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
      }
    };
  }, [isAuthenticated, validateToken, refreshToken, router]);

  // ==================== LOAD STORED DATA ON MOUNT ====================

  useEffect(() => {
    const loadStoredData = async () => {
      const storedUser = getUser();
      const storedSocioExtra = getSocioExtra();
      const hasToken = checkIsAuthenticated();

      if (storedUser && hasToken) {
        // Validar que el token sigue siendo válido
        const isValid = await validateToken();

        if (isValid) {
          setUserState(storedUser);
          if (storedSocioExtra) {
            setSocioExtraState(storedSocioExtra);
          }
        } else {
          // Intentar refresh
          const refreshed = await refreshToken();
          if (refreshed) {
            setUserState(storedUser);
            if (storedSocioExtra) {
              setSocioExtraState(storedSocioExtra);
            }
          } else {
            // Limpiar datos expirados
            clearAuthData();
          }
        }
      }

      setIsLoading(false);
    };

    loadStoredData();
  }, [validateToken, refreshToken]);

  // ==================== LISTEN FOR LOGOUT BROADCAST ====================

  useEffect(() => {
    const unsubscribe = onLogoutBroadcast(() => {
      setUserState(null);
      setSocioExtraState(null);
      setShowInactivityWarning(false);
      router.push("/auth/login");
    });

    return unsubscribe;
  }, [router]);

  // ==================== LOGIN ====================

  const login = useCallback(
    async (loginResponse: LoginResponse) => {
      // Guardar tokens y usuario
      saveAuthData(loginResponse);
      setUserState(loginResponse.user);

      // Resetear timers de inactividad
      resetInactivityTimers();

      // Si es socio, obtener datos adicionales
      if (loginResponse.user.rol === "socio") {
        setLoadingPartner(true);
        try {
          const partnerRes = await api.get(
            `/partners/usuario/${loginResponse.user.id}`,
          );
          const partner = Array.isArray(partnerRes.data)
            ? partnerRes.data[0]
            : partnerRes.data;

          if (partner && partner.n_socio) {
            const extra: SocioExtra = {
              id: partner.id,
              n_socio: partner.n_socio,
              monto_semanal: partner.monto_semanal,
            };
            saveSocioExtra(extra);
            setSocioExtraState(extra);
          } else {
            // No hay socio asignado aún
            saveSocioExtra(null);
            setSocioExtraState(null);
          }
        } catch {
          // Error 404 significa que el usuario no tiene un socio asignado aún
          // Este no es un error crítico, simplemente significa que necesita solicitar ser socio
          console.log("Usuario sin socio asignado");
          saveSocioExtra(null);
          setSocioExtraState(null);
        } finally {
          setLoadingPartner(false);
        }
      } else {
        // Admin no tiene socioExtra
        saveSocioExtra(null);
        setSocioExtraState(null);
      }
    },
    [resetInactivityTimers],
  );

  // ==================== LOGOUT ====================

  const logout = useCallback(() => {
    // Limpiar timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (tokenCheckIntervalRef.current) {
      clearInterval(tokenCheckIntervalRef.current);
    }

    clearAuthData();
    broadcastLogout();
    setUserState(null);
    setSocioExtraState(null);
    setShowInactivityWarning(false);
    router.push("/auth/login");
  }, [router]);

  // ==================== SET USER ====================

  const setUser = useCallback((newUser: UserResponse | null) => {
    if (newUser) {
      updateUser(newUser);
    }
    setUserState(newUser);
  }, []);

  // ==================== SET SOCIO EXTRA ====================

  const setSocioExtra = useCallback((extra: SocioExtra | null) => {
    saveSocioExtra(extra);
    setSocioExtraState(extra);
  }, []);

  // ==================== REFRESH USER DATA ====================

  const refreshUserData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data } = await api.get<UserResponse>(`/users/id/${user.id}`);
      setUser(data);
    } catch (error) {
      console.error("Error al refrescar datos del usuario:", error);
    }
  }, [user?.id, setUser]);

  // ==================== VALUE ====================

  const value: AuthContextProps = {
    user,
    socioExtra,
    isLoading,
    loadingPartner,
    isAuthenticated,
    showInactivityWarning,
    login,
    logout,
    setUser,
    setSocioExtra,
    refreshUserData,
    refreshToken,
    validateToken,
    extendSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ==================== HOOK ====================

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// ==================== LEGACY HOOK (compatibilidad) ====================

/**
 * Hook de compatibilidad con el antiguo useUser
 * @deprecated Usar useAuth en su lugar
 */
export function useUser() {
  const { user, socioExtra, setUser, setSocioExtra } = useAuth();
  return {
    user,
    socioExtra,
    setUserUser: setUser,
    setSocioExtra,
  };
}

export default AuthContext;
