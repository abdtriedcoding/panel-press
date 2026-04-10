"use client";

import type { ReactNode } from "react";

export function ClerkProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  return { isLoaded: true, isSignedIn: true, userId: "demo-user" };
}

export function useClerk() {
  return { openSignIn: () => {}, signOut: () => {} };
}

export function useUser() {
  return { isLoaded: true, isSignedIn: true, user: { id: "demo-user" } };
}

export function SignInButton({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function UserButton() {
  return null;
}

export function Show({ when, children }: { when: string; children: ReactNode }) {
  if (when === "signed-in") return <>{children}</>;
  return null;
}

export function SignedIn({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function SignedOut() {
  return null;
}
