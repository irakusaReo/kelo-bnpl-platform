"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { Loan } from "@/types";

export const useLoans = (userId?: string) => {
  const { supabase } = useUser();

  const fetchLoans = async () => {
    if (!userId || !supabase) {
      throw new Error("User not authenticated.");
    }

    const { data, error } = await supabase
      .from("loans")
      .select(`
        id,
        amount,
        status,
        created_at,
        merchant_stores ( name ),
        repayments ( id, due_date, amount, status )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data as Loan[];
  };

  return useQuery({
    queryKey: ["loans", userId],
    queryFn: fetchLoans,
    enabled: !!userId && !!supabase,
    retry: 1,
  });
};
