
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
import type { PatientImage } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  // The file input is not directly validated by Zod in this basic setup.
  // We'll add a description validation.
  description: z.string().min(1, "Description is required."),
  category: z.enum(['Image', 'X-Ray', 'Other Doc']),
});

type ImageUploadFormProps = {
  onSave: (data: Omit<PatientImage, 'date'>) => void;
  onOpenChange: (open: boolean) => void;
};

export function ImageUploadForm({ onSave, onOpenChange }: ImageUploadFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      category: "Image",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real app, you would handle the file upload here.
    // For this prototype, we'll use a placeholder URL.
    onSave({
      url: `https://picsum.photos/seed/newxray${Date.now()}/800/600`,
      description: values.description,
      category: values.category,
    });
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Patient Document</DialogTitle>
          <DialogDescription>
            Add a new image, X-ray, or other document to the patient's record.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormItem>
              <FormLabel>Image File</FormLabel>
              <FormControl>
                <Input type="file" />
              </FormControl>
              <FormMessage />
            </FormItem>
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Image">Image</SelectItem>
                      <SelectItem value="X-Ray">X-Ray</SelectItem>
                      <SelectItem value="Other Doc">Other Doc</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Panoramic X-ray showing impacted molar..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Image</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
