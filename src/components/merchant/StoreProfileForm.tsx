"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { getStore, updateStore } from "@/services/merchant";
import { StorePayload } from "@/types/merchant";
import { Skeleton } from "@/components/ui/skeleton";

const storeProfileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Store name must be at least 2 characters.",
  }),
  logo_url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

type StoreProfileFormValues = z.infer<typeof storeProfileFormSchema>;

export function StoreProfileForm({ storeId }: { storeId: string }) {
  const queryClient = useQueryClient();

  const { data: store, isLoading, isError } = useQuery({
    queryKey: ["merchantStore", storeId],
    queryFn: () => getStore(storeId),
    enabled: !!storeId,
  });

  const mutation = useMutation({
    mutationFn: (data: StorePayload) => updateStore(storeId, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your store profile has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["merchantStore", storeId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update store profile. " + error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<StoreProfileFormValues>({
    resolver: zodResolver(storeProfileFormSchema),
    values: {
      name: store?.name ?? "",
      logo_url: store?.logo_url ?? "",
    },
    mode: "onChange",
  });

  function onSubmit(data: StoreProfileFormValues) {
    mutation.mutate(data);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-24" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-destructive">Failed to load store profile.</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Store Name</FormLabel>
              <FormControl>
                <Input placeholder="Your store name" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="logo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/logo.png" {...field} />
              </FormControl>
              <FormDescription>
                Link to your store's logo.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Updating..." : "Update profile"}
        </Button>
      </form>
    </Form>
  );
}