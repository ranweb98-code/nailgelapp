import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "כניסת בעלת העסק · Studio Noir" };

export default async function AdminLoginPage() {
  if (await isAuthenticated()) redirect("/admin");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl text-noir-900">פאנל הניהול</h1>
          <p className="mt-1 text-sm text-neutral-600">
            כניסה לניהול התורים וההגדרות
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
