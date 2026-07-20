import { OwnerPushSetup } from "@/components/OwnerPushSetup";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-theme min-h-dvh">
      {children}
      <OwnerPushSetup />
    </div>
  );
}
