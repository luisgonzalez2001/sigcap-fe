import { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  rol: string;
}

interface UserContextProps {
  user: User | null;
  setUserUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const setUserUser = setUser;

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (storedUser) setUser(storedUser);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUserUser }}>
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
