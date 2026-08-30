import { z } from 'zod';

export const labServicePriceSchema = z.object({
  lab_service_id: z.number()
    .int('Lab service must be selected'),
  lab: z.string()
    .min(1, 'Lab name is required')
    .max(255, 'Lab name cannot exceed 255 characters'),
  base_price: z.number()
    .positive('Price must be greater than 0')
    .multipleOf(0.01, 'Price must have at most 2 decimal places'),
  is_active: z.boolean().default(true),
});

export type LabServicePriceFormData = z.infer<typeof labServicePriceSchema>;
