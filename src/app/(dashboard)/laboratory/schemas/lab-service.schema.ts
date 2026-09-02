import { z } from 'zod';

export const labServiceSchema = z.object({
  service_name: z.string()
    .min(1, 'Service name is required')
    .max(255, 'Service name cannot exceed 255 characters'),
  category: z.string()
    .max(255, 'Category cannot exceed 255 characters')
    .optional()
    .nullable(),
  is_active: z.boolean().default(true),
});

export type LabServiceFormData = z.infer<typeof labServiceSchema>;
