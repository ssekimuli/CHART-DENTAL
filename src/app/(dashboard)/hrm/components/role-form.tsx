
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const formSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters."),
});

type RoleFormProps = {
    role?: { id: string | number; name: string };
    onSave: (name: string) => void;
    onOpenChange: (open: boolean) => void;
};

export function RoleForm({ role, onSave, onOpenChange }: RoleFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: role?.name ?? "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave(values.name);
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{role ? "Edit Role" : "Add Role"}</DialogTitle>
                <DialogDescription>
                    {role ? `Update the name for the "${role.name}" role.` : "Create a new staff position for your practice."}
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Role Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Head of Hygiene" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit">{role ? "Save Changes" : "Create Role"}</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}

