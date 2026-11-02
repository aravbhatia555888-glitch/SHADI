import { useAuthStore } from "@/stores/auth-store";
import { useRouter,useSegments } from "expo-router";
import React,{ useEffect } from "react";
import LoadingScreen from "./LoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "auth";

    if (!user && !inAuthGroup) {
      router.replace("/auth/login");
    } else if (user && inAuthGroup) {
      // Route through the entry gate so onboarding decides where to land.
      router.replace("/");
    }
  }, [user, loading, segments, router]);

  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  return <>{children}</>;
}
