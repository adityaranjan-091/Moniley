"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Trash2, AlertTriangle, FileText } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function DataSettingsPage() {
  const { user, deleteCurrentUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleExportCSV = async () => {
    try {
      const email = user?.email;
      if (!email) return;

      const res = await fetch(`/api/transactions?userId=${email}`);
      const json = await res.json();

      if (json.success && json.transactions) {
        const headers = ["Date", "Description", "Category", "Type", "Amount"];
        const escapeCsv = (val: any) => `"${String(val || "").replace(/"/g, '""')}"`;
        const rows = json.transactions.map((t: any) => [
          escapeCsv(t.date ? new Date(t.date).toLocaleDateString() : (t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "")),
          escapeCsv(t.description),
          escapeCsv(t.category),
          escapeCsv(t.type),
          t.amount, // amount is a number, safe without quotes
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map((row: any[]) => row.join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "transactions.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to export data");
    }
  };

  const handleResetData = async () => {
    if (
      !confirm(
        "Are you sure? This will delete all your transactions, budgets, and goals.",
      )
    )
      return;
    try {
      const res = await fetch("/api/settings/data?type=reset", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.email }),
      });
      if (res.ok) {
        alert("Data reset successfully.");
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteCurrentUser();
      const res = await fetch("/api/settings/data?type=account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.email }),
      });
      if (res.ok) {
        alert("Account deleted.");
        router.push("/login"); // or signout
      }
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to delete account",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Data Management</h3>
        <p className="text-sm text-muted-foreground">
          Export your data or manage your account existence.
        </p>
      </div>
      <Separator />

      <div className="space-y-4">
        <h4 className="text-sm font-medium">Export Data</h4>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4" />
            Export Transactions (CSV)
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => router.push("/reports")}
          >
            <FileText className="h-4 w-4" />
            Go to Reports (PDF)
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Danger Zone
        </h4>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Reset Data</p>
              <p className="text-xs text-muted-foreground">
                Delete all transactions, budgets, and goals. Account remains.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Reset Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your financial data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetData}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <Separator className="bg-destructive/20" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-xs text-muted-foreground">
                Permanently remove your account and all data.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
