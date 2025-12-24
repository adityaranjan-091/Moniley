"use client";

import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function GeneralSettingsPage() {
    const { setTheme, theme } = useTheme();

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">General</h3>
                <p className="text-sm text-muted-foreground">
                    Customize the appearance and behavior of the application.
                </p>
            </div>
            <Separator />

            {/* Theme Section */}
            <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <span className="text-[0.8rem] text-muted-foreground">
                        Select the theme for the dashboard.
                    </span>
                </div>
                <Select onValueChange={setTheme} defaultValue={theme || "system"}>
                    <SelectTrigger id="theme" className="w-[200px]">
                        <SelectValue placeholder="Select a theme" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Separator />

            {/* Currency Section */}
            <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <span className="text-[0.8rem] text-muted-foreground">
                        Select your preferred currency for display.
                    </span>
                </div>
                <Select defaultValue="INR">
                    <SelectTrigger id="currency" className="w-[200px]">
                        <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="INR">ABC (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-[0.8rem] text-muted-foreground">
                    Note: This is for display purposes only. Actual conversion is not supported yet.
                </p>
            </div>
        </div>
    );
}
