"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Laptop, Smartphone, ShieldAlert } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function SecuritySettingsPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: ""
    });

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (passwords.new !== passwords.confirm) {
            alert("New passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/settings/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: session?.user?.email,
                    currentPassword: passwords.current,
                    newPassword: passwords.new
                })
            });

            const json = await res.json();
            if (json.success) {
                alert("Password changed successfully");
                setPasswords({ current: "", new: "", confirm: "" });
            } else {
                alert(json.message || "Failed to change password");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Security</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your password and account security.
                </p>
            </div>
            <Separator />

            <div className="space-y-4">
                <h4 className="text-sm font-medium">Change Password</h4>
                <form onSubmit={handleChangePassword} className="space-y-4 rounded-lg border p-4">
                    <div className="grid gap-2">
                        <Label htmlFor="current">Current Password</Label>
                        <Input
                            id="current"
                            type="password"
                            value={passwords.current}
                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="new">New Password</Label>
                        <Input
                            id="new"
                            type="password"
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirm">Confirm New Password</Label>
                        <Input
                            id="confirm"
                            type="password"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            required
                        />
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                    </Button>
                </form>
            </div>

            <Separator />

            <div className="space-y-4">
                <h4 className="text-sm font-medium">Active Sessions</h4>
                <div className="rounded-lg border divide-y">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <Laptop className="h-8 w-8 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Windows PC - Chrome</p>
                                <p className="text-xs text-muted-foreground">Generic Location • Active Now</p>
                            </div>
                        </div>
                        <div className="text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-1 rounded">Current</div>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    This is a list of devices that have logged into your account. Revoke any sessions that you do not recognize.
                </p>
            </div>
            <Separator />
            <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-primary" />
                    Security Alerts
                </h4>
                <p className="text-sm text-muted-foreground">
                    No recent security incidents detected.
                </p>
            </div>
        </div>
    );
}
