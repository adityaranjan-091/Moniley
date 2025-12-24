"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, User, Mail, Calendar, CreditCard, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [name, setName] = useState("");

    useEffect(() => {
        if (session?.user?.email) {
            fetchProfile();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    async function fetchProfile() {
        try {
            const email = session?.user?.email;
            if (!email) return;

            const res = await fetch(`/api/profile?userId=${email}`);
            const json = await res.json();
            if (json.success) {
                setProfile(json.data);
                setName(json.data.name || "");
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdateProfile(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: session?.user?.email,
                    name
                })
            });
            if (res.ok) {
                await update({ name }); // Update NextAuth session
                alert("Profile updated!");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to update profile");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    if (!profile) {
        return <div className="text-center p-8 text-destructive">User not found</div>;
    }

    return (
        <div className="space-y-8 p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column: Avatar & Basic Info */}
                <Card className="w-full md:w-1/3 h-fit">
                    <CardHeader className="flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src={profile.image} />
                            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                {profile.name?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <CardTitle>{profile.name}</CardTitle>
                        <CardDescription>{profile.email}</CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Joined {new Date(profile.memberSince).toLocaleDateString()}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Edit Form & Stats */}
                <div className="flex-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Profile</CardTitle>
                            <CardDescription>Update your personal information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" value={profile.email} disabled className="bg-muted" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Display Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your Name"
                                    />
                                </div>
                                <Button type="submit" disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{profile.transactionCount}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Budgets</CardTitle>
                                <PieChart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{profile.budgetCount}</div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
