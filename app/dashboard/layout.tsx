import type { Metadata } from "next";
import { DashboardShell } from "@/components/admin/dashboard-shell";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <DashboardShell>{children}</DashboardShell>
      <SiteFooter />
    </>
  );
}
