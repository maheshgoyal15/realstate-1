import { z } from "zod";

// Mandatory Secure Web Skills: Input Validation & Sanitization
// Treat all external data as untrusted. Validate inputs against an allow-list of expected types, lengths, and formats.

export const propertyMetadataSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters").max(500, "Address is too long"),
  mlsId: z.string().max(100).optional(),
  userBudget: z.number().min(1000, "Budget must be at least $1,000").max(10000000, "Budget exceeds maximum threshold"),
  stylePreference: z.enum(["modern", "traditional", "contemporary", "farmhouse", "midcentury", "craftsman", "transitional"], {
    errorMap: () => ({ message: "Please select a supported architectural style." }),
  }),
});

export const uploadFormSchema = z.object({
  propertyId: z.string().min(5).max(100),
  images: z.array(z.string()).min(1, "Please upload at least one image").max(50, "Batch upload is limited to 50 images"),
  metadata: propertyMetadataSchema,
});

export const quoteRequestSchema = z.object({
  recommendationId: z.string().min(10).max(100),
  contractorId: z.string().min(10).max(100),
  userNotes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
});

export type PropertyMetadataFormValues = z.infer<typeof propertyMetadataSchema>;
export type UploadFormValues = z.infer<typeof uploadFormSchema>;
export type QuoteRequestFormValues = z.infer<typeof quoteRequestSchema>;
