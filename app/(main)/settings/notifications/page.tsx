"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast"; // assuming hook exists or I'll implement a basic alert
import { useAuth } from "@/hooks/use-auth";

export default function NotificationsSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    inAppNotifications: true,
    budgetAlerts: true,
    largeTransactionAlerts: true,
    lowBalanceAlerts: false,
    goalMilestones: true,
  });

  // Mock fetch, in reality would fetch from API
  useEffect(() => {
    // if (session) fetchSettings();
  }, [user]);

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.email,
          notifications: settings,
        }),
      });
      // Show success (using built-in alert for now if toast not found, but we should check)
      alert("Settings saved!");
    } catch (error) {
      console.error("Failed to save settings", error);
      alert("Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Configure how you receive alerts and updates.
        </p>
      </div>
      <Separator />

      <div className="space-y-4">
        <h4 className="text-sm font-medium">Channels</h4>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="text-base">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive daily summaries and critical alerts via email.
            </p>
          </div>
          <Switch
            checked={settings.emailNotifications}
            onCheckedChange={() => handleToggle("emailNotifications")}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="text-base">Push Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive real-time alerts on your device.
            </p>
          </div>
          <Switch
            checked={settings.pushNotifications}
            onCheckedChange={() => handleToggle("pushNotifications")}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="text-base">In-App Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Show badges and alerts within the dashboard.
            </p>
          </div>
          <Switch
            checked={settings.inAppNotifications}
            onCheckedChange={() => handleToggle("inAppNotifications")}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-sm font-medium">Alert Preferences</h4>
        <div className="grid gap-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base" htmlFor="budget">Budget Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Notify when exceeding 80% of budget.
              </p>
            </div>
            <Switch
              id="budget"
              checked={settings.budgetAlerts}
              onCheckedChange={() => handleToggle("budgetAlerts")}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base" htmlFor="large">Large Transaction Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Notify for transactions over ₹10,000.
              </p>
            </div>
            <Switch
              id="large"
              checked={settings.largeTransactionAlerts}
              onCheckedChange={() => handleToggle("largeTransactionAlerts")}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base" htmlFor="low">Low Balance Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Notify when balance drops below ₹1,000.
              </p>
            </div>
            <Switch
              id="low"
              checked={settings.lowBalanceAlerts}
              onCheckedChange={() => handleToggle("lowBalanceAlerts")}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base" htmlFor="goals">Goal Milestones</Label>
              <p className="text-sm text-muted-foreground">
                Celebrate when you reach a savings goal.
              </p>
            </div>
            <Switch
              id="goals"
              checked={settings.goalMilestones}
              onCheckedChange={() => handleToggle("goalMilestones")}
            />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Preferences
      </Button>
    </div>
  );
}
