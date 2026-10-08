"use client";

import dynamic from "next/dynamic";
import { PwaSafeArea } from "@/components/PwaSafeArea";

const ServiceWorkerRegister = dynamic(
  () =>
    import("@/components/ServiceWorkerRegister").then((m) => ({
      default: m.ServiceWorkerRegister,
    })),
  { ssr: false }
);

const HomeScreenInstallGate = dynamic(
  () =>
    import("@/components/HomeScreenInstallGate").then((m) => ({
      default: m.HomeScreenInstallGate,
    })),
  { ssr: false }
);

const NotificationPermissionGate = dynamic(
  () =>
    import("@/components/NotificationPermissionGate").then((m) => ({
      default: m.NotificationPermissionGate,
    })),
  { ssr: false }
);

export function ClientShell() {
  return (
    <>
      <PwaSafeArea />
      <ServiceWorkerRegister />
      <HomeScreenInstallGate />
      <NotificationPermissionGate />
    </>
  );
}
