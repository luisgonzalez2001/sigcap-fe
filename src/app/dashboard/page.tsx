"use client";

import { useUser } from "@/context/UserContext";
import Dashboard from "@/components/Dashboard/DashBoard";

export const DashboardPage = () => {
  const { user } = useUser();

  return <Dashboard userRole={user?.rol || "socio"} />;
};

export default DashboardPage;
