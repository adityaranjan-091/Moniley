import Image from "next/image";

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <main className="flex min-h-screen w-full">
            {/* Left side: Brand/Welcome Section (Desktop only) */}
            <section className="hidden w-1/2 flex-col justify-between bg-primary p-10 lg:flex xl:w-2/5">
                <div className="flex items-center gap-2">
                    <Image
                        src="/fin-logo.png"
                        alt="Moniley Logo"
                        width={40}
                        height={40}
                        className="h-10 w-auto brightness-0 invert"
                    />
                    <span className="font-poppins text-2xl font-bold text-white">
                        Moniley
                    </span>
                </div>

                <div className="space-y-4 text-white">
                    <h1 className="font-poppins text-4xl font-bold leading-tight">
                        Manage your finances with confidence.
                    </h1>
                    <p className="text-primary-foreground/80">
                        Join thousands of users who are taking control of their financial
                        future with Moniley's advanced tracking and analytics tools.
                    </p>
                </div>

                <div className="text-sm text-primary-foreground/60">
                    © {new Date().getFullYear()} Moniley. All rights reserved.
                </div>
            </section>

            {/* Right side: Form Section */}
            <section className="flex w-full flex-col items-center justify-center bg-background p-6 lg:w-1/2 xl:w-3/5">
                {/* Mobile Logo (Visible only on smaller screens) */}
                <div className="mb-8 flex items-center gap-2 lg:hidden">
                    <Image
                        src="/fin-logo.png"
                        alt="Moniley Logo"
                        width={32}
                        height={32}
                        className="h-8 w-auto"
                    />
                    <span className="font-poppins text-xl font-bold text-primary">
                        Moniley
                    </span>
                </div>

                <div className="w-full max-w-[420px]">
                    {children}
                </div>
            </section>
        </main>
    );
}
