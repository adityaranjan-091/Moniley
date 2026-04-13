import Navbar from "@/components/Navbar";
import AppSidebar from "@/components/AppSidebar"; // Ensure this path is correct
import Providers from "@/Context/Providers"; // Check your Providers path
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <SidebarProvider defaultOpen={true}>
        {/* 1. Outer Container: Flex Column (Navbar on Top) */}
        <div className="flex min-h-screen w-full flex-col bg-muted/20">
          {/* Top: Full Width Navbar */}
          <Navbar />

          {/* 2. Inner Container: Flex Row (Sidebar | Content) */}
          <div className="flex flex-1 overflow-hidden pt-20">
            {/* Left: Sidebar (Sits below navbar due to flex-col parent) */}
            <AppSidebar />

            {/* Right: Main Content Area */}
            <main className="flex-1 overflow-y-auto p-6 md:p-8">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </Providers>
  );
}
