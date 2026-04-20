"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  TrendingUp,
  TrendingDown,
  Settings,
  LogOut,
  PieChart,
  BarChart,
  Target,
  Bot,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Income", href: "/income", icon: TrendingUp },
  { name: "Expense", href: "/expense", icon: TrendingDown },
  { name: "Categories", href: "/categories", icon: Settings },
  { name: "Budgets", href: "/budgets", icon: PieChart },
  { name: "Reports", href: "/reports", icon: BarChart },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "AI Advisor", href: "/chat", icon: Bot },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <Sidebar
      collapsible="icon"
      /* Fix: Sit below the 4rem sticky navbar and take remaining height */
      className="top-14 h-[calc(100svh-3.5rem)] border-r bg-background"
    >
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              // Active state logic
              const isActive =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.name}
                    className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Log Out"
              onClick={() => signOut()}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
