import { redirect } from "next/navigation";

export default function Home() {
  const ToHome = redirect("/home");

  return ToHome;
}
