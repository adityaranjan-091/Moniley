"use client";

import { useContext } from "react";
import { AuthContext } from "@/Context/FirebaseAuthProvider";

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within FirebaseAuthProvider");
  }

  return context;
}
