"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Laptop, Smartphone, ShieldAlert } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function SecuritySettingsPage() {
  const {
    user,
    loading: authLoading,
    changePassword,
    sendPasswordReset,
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const isPasswordAccount =
    user?.providerData?.some(
      (provider) => provider.providerId === "password",
    ) ?? false;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (passwords.new !== passwords.confirm) {
      alert("New passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await changePassword(passwords.current, passwords.new);
      alert("Password changed successfully");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReset = async () => {
    try {
      if (!user?.email) return;
      await sendPasswordReset(user.email);
      alert("Password reset email sent.");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to send reset email",
      );
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
        {!isPasswordAccount ? (
          <div className="space-y-3 rounded-lg border p-4 text-sm text-muted-foreground">
            <p>
              This account uses Google sign-in, so password changes are managed
              by the Google account.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleSendReset}
              disabled={!user?.email}
            >
              Send Password Reset Email
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleChangePassword}
            className="space-y-4 rounded-lg border p-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="current">Current Password</Label>
              <Input
                id="current"
                type="password"
                value={passwords.current}
                onChange={(e) =>
                  setPasswords({ ...passwords, current: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new">New Password</Label>
              <Input
                id="new"
                type="password"
                value={passwords.new}
                onChange={(e) =>
                  setPasswords({ ...passwords, new: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <Input
                id="confirm"
                type="password"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords({ ...passwords, confirm: e.target.value })
                }
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        )}
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
                <p className="text-xs text-muted-foreground">
                  Generic Location • Active Now
                </p>
              </div>
            </div>
            <div className="text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-1 rounded">
              Current
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          This is a list of devices that have logged into your account. Revoke
          any sessions that you do not recognize.
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
