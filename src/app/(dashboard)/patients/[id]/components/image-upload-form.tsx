"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { X, FileIcon, Loader2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  description: z.string().min(1, "Description is required."),
  category: z.enum(['Image', 'X-Ray', 'Other Doc']),
});

type ImageUploadFormProps = {
  onSave: (data: FormData) => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
};

export function ImageUploadForm({ onSave, onOpenChange }: ImageUploadFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      category: "Image",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    // Reset the input value so the same files can be selected again if needed
    e.target.value = '';
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (files.length === 0) {
      alert("Please select at least one file to upload.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files[]", file);
      });
      formData.append("description", values.description);
      formData.append("category", values.category);

      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
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
              <FormLabel>Document File</FormLabel>
              <FormControl>
                <Input type="file" multiple onChange={handleFileChange} />
              </FormControl>
              <FormMessage />
              
              {files.length > 0 && (
                <div className="w-full max-w-[450px] overflow-hidden">
                  <div className="flex w-full overflow-x-auto gap-3 mt-4 pb-2 pr-2 snap-x scrollbar-thin">
                    {files.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="relative group border rounded-md p-2 flex flex-col items-center justify-center bg-muted/20 min-w-[120px] max-w-[120px] snap-center flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 hover:bg-destructive/90"
                        title="Remove file"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="h-16 w-full object-cover rounded-md mb-1"
                        />
                      ) : (
                        <FileIcon className="h-10 w-10 text-muted-foreground mb-1" />
                      )}
                      <span className="text-[10px] truncate w-full text-center" title={file.name}>
                        {file.name}
                      </span>
                    </div>
                  ))}
                </div>
                </div>
              )}
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload Document(s)"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
