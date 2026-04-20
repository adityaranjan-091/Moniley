"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, User, LogOut, Settings, CreditCard } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";

// Shadcn UI Imports
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar"; // Import Trigger
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [query, setQuery] = useState("");
  const userName = user?.displayName || user?.email || "User";
  const userInitial = userName.trim().charAt(0).toUpperCase() || "U";

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/dashboard?search=${encodeURIComponent(q)}`);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/70 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-background/50">
      <div className="flex h-14 items-center px-3 sm:px-6 lg:px-8">
        {/* LEFT: Sidebar Trigger & Logo */}
        <div className="flex items-center gap-4">
          {/* This button toggles the sidebar */}
          <SidebarTrigger className="-ml-2" />

          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Image
                src="/fin-logo.png"
                alt="Moniley Logo"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <span className="hidden text-lg font-bold tracking-tight text-foreground md:block">
              Moniley
            </span>
          </Link>
        </div>

        {/* CENTER: Search Bar */}
        <div className="flex flex-1 items-center justify-center px-2 sm:px-4">
          <form onSubmit={onSearch} className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search transactions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border-border/60 bg-background/40 pl-9 shadow-inner focus-visible:bg-background/70 focus-visible:ring-primary"
            />
          </form>
        </div>

        {/* RIGHT: Actions & Profile */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.displayName || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/settings/notifications")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings/data")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Export Data</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/settings/security")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Security</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
