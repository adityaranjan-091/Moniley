"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const sidebarNavItems = [
    {
        title: "General",
        href: "/settings/general",
    },
    {
        title: "Notifications",
        href: "/settings/notifications",
    },
    {
        title: "Security",
        href: "/settings/security",
    },
    {
        title: "Data",
        href: "/settings/data",
    },
];

interface SettingsLayoutProps {
    children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <div className="hidden space-y-6 p-10 pb-16 md:block">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and set e-mail preferences.
                </p>
            </div>
            <Separator className="my-6" />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                    <SidebarNav items={sidebarNavItems} />
                </aside>
                <div className="flex-1 lg:max-w-2xl">{children}</div>
            </div>
        </div>
    );
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
    items: {
        href: string;
        title: string;
    }[];
}

function SidebarNav({ className, items, ...props }: SidebarNavProps) {
    const pathname = usePathname();

    return (
        <nav
            className={cn(
                "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
                className
            )}
            {...props}
        >
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        buttonVariants({ variant: "ghost" }),
                        pathname === item.href
                            ? "bg-muted hover:bg-muted"
                            : "hover:bg-transparent hover:underline",
                        "justify-start"
                    )}
                >
                    {item.title}
                </Link>
            ))}
        </nav>
    );
}
