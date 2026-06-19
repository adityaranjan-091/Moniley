"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Settings, Bell, Shield, Database } from "lucide-react";

const sidebarNavItems = [
    {
        title: "General",
        href: "/settings/general",
        icon: Settings,
    },
    {
        title: "Notifications",
        href: "/settings/notifications",
        icon: Bell,
    },
    {
        title: "Security",
        href: "/settings/security",
        icon: Shield,
    },
    {
        title: "Data",
        href: "/settings/data",
        icon: Database,
    },
];

interface SettingsLayoutProps {
    children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 p-4 md:p-8 animate-in fade-in duration-500">
            <aside className="w-full lg:w-64 shrink-0">
                <div className="space-y-2 mb-6 lg:mb-8">
                    <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Settings</h2>
                    <p className="text-sm text-muted-foreground font-medium">
                        Manage your account settings and preferences.
                    </p>
                </div>
                <SidebarNav items={sidebarNavItems} />
            </aside>
            <div className="flex-1 w-full lg:max-w-3xl">
                <div className="rounded-3xl border border-border/60 bg-card/40 backdrop-blur-xl shadow-sm p-6 sm:p-8 min-h-[500px]">
                    {children}
                </div>
            </div>
        </div>
    );
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
    items: {
        href: string;
        title: string;
        icon: React.ComponentType<{ className?: string }>;
    }[];
}

function SidebarNav({ className, items, ...props }: SidebarNavProps) {
    const pathname = usePathname();

    return (
        <nav
            className={cn(
                "flex space-x-2 overflow-x-auto pb-4 lg:pb-0 lg:flex-col lg:space-x-0 lg:space-y-2 whitespace-nowrap scrollbar-hide",
                className
            )}
            {...props}
        >
            {items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            isActive
                                ? "bg-primary/15 text-primary shadow-sm hover:bg-primary/20"
                                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                            "justify-start gap-4 h-12 px-5 rounded-2xl transition-all font-semibold items-center",
                            !isActive && "border border-transparent hover:border-border/50"
                        )}
                    >
                        <Icon className={cn("size-5", isActive ? "text-primary" : "text-muted-foreground")} />
                        {item.title}
                    </Link>
                );
            })}
        </nav>
    );
}
