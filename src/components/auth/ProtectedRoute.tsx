"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!user) {
            // Save the attempted url to localstorage since we can't pass state
            localStorage.setItem("redirectAfterLogin", pathname);
            router.push("/account");
        }
    }, [user, pathname, router]);

    if (!user) {
        return null; // Or a loading spinner
    }

    return <>{children}</>;
};
