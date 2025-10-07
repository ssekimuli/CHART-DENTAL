
"use client";

import { useAuthContext } from "@/context/auth-context";

export const useUser = () => {
  const context = useAuthContext();
  return context?.user;
};
