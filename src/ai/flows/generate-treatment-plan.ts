// The AI code.
'use server';
/**
 * @fileOverview AI agent for generating a preliminary treatment plan from logged symptoms and dental conditions.
 *
 * - generateTreatmentPlan - A function that handles the treatment plan generation process.
 * - GenerateTreatmentPlanInput - The input type for the generateTreatmentPlan function.
 * - GenerateTreatmentPlanOutput - The return type for the generateTreatmentPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTreatmentPlanInputSchema = z.object({
  symptoms: z
    .string()
    .describe('The symptoms reported by the patient.'),
  dentalConditions: z
    .string()
    .describe('The dental conditions observed by the dentist.'),
  patientHistory: z
    .string()
    .optional()
    .describe('Relevant patient medical history.'),
});
export type GenerateTreatmentPlanInput = z.infer<
  typeof GenerateTreatmentPlanInputSchema
>;

const GenerateTreatmentPlanOutputSchema = z.object({
  treatmentPlan: z
    .string()
    .describe('The generated preliminary treatment plan.'),
  rationale: z
    .string()
    .describe('The rationale behind the generated treatment plan.'),
});
export type GenerateTreatmentPlanOutput = z.infer<
  typeof GenerateTreatmentPlanOutputSchema
>;

export async function generateTreatmentPlan(
  input: GenerateTreatmentPlanInput
): Promise<GenerateTreatmentPlanOutput> {
  return generateTreatmentPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTreatmentPlanPrompt',
  input: {schema: GenerateTreatmentPlanInputSchema},
  output: {schema: GenerateTreatmentPlanOutputSchema},
  prompt: `You are an experienced dentist tasked with creating a preliminary treatment plan based on the provided symptoms, dental conditions, and patient history.

  Symptoms: {{{symptoms}}}
  Dental Conditions: {{{dentalConditions}}}
  Patient History: {{{patientHistory}}}

  Based on the above information, generate a detailed preliminary treatment plan and provide a clear rationale for your proposed treatments. The treatment plan should include specific procedures, medications, and aftercare instructions where applicable. Consider all possible diagnoses and prioritize the most likely and impactful treatments.

  Treatment Plan:`,
});

const generateTreatmentPlanFlow = ai.defineFlow(
  {
    name: 'generateTreatmentPlanFlow',
    inputSchema: GenerateTreatmentPlanInputSchema,
    outputSchema: GenerateTreatmentPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
