import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function SophosPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-2xl font-bold mb-4">Sophos Security</h1>
                <div className="grid gap-4">
                  <div className="rounded-lg border p-4">
                    <h2 className="text-lg font-semibold mb-2">Security Overview</h2>
                    <p className="text-muted-foreground">
                      Manage your Sophos security settings and monitor threats.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h2 className="text-lg font-semibold mb-2">Active Threats</h2>
                    <p className="text-muted-foreground">
                      No active threats detected.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h2 className="text-lg font-semibold mb-2">Security Settings</h2>
                    <p className="text-muted-foreground">
                      Configure firewall, antivirus, and other security features.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 