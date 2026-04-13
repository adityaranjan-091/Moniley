"use client";

import { ThemeProvider } from "next-themes";
import FirebaseAuthProvider from "./FirebaseAuthProvider";

export default function Providers({ children }) {
  return (
    <FirebaseAuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </FirebaseAuthProvider>
  );
}
