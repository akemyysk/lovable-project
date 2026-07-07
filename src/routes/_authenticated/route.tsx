import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="h-14 flex items-center gap-3 border-b bg-background/70 backdrop-blur px-4 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="flex-1" />
            <ThemeToggle />
          </header>
          <main className="flex-1 px-4 md:px-8 py-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
