import { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  rol: "admin" | "socio";
  active?: boolean;
  verified?: boolean;
}

interface SocioExtra {
  id: string;
  n_socio: number;
  monto_semanal: number;
}

interface UserContextProps {
  user: User | null;
  socioExtra: SocioExtra | null;
  setUserUser: (user: User | null) => void;
  setSocioExtra: (extra: SocioExtra | null) => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [socioExtra, setSocioExtra] = useState<SocioExtra | null>(null);

  const setUserUser = setUser;

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (storedUser) setUser(storedUser);
    // Nuevo: cargar socioExtra
    const storedSocioExtra = JSON.parse(
      localStorage.getItem("socioExtra") || "null",
    );
    if (storedSocioExtra) setSocioExtra(storedSocioExtra);
  }, []);

  return (
    <UserContext.Provider
      value={{ user, socioExtra, setUserUser, setSocioExtra }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
