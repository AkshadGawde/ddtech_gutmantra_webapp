import { useState } from "react";
import AdminLogin from "../components/admin/AdminLogin";
import AdminPanel from "../components/admin/AdminPanel";

export default function AdminPage() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem("gm_admin_auth") === "true"
  );

  if (!authed) {
    return <AdminLogin onLoginSuccess={() => setAuthed(true)} />;
  }

  return <AdminPanel />;
}
