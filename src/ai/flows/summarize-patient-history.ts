'use server';

/**
 * @fileOverview Summarizes a patient's dental history.
 *
 * - summarizePatientHistory - A function that summarizes the patient history.
 * - SummarizePatientHistoryInput - The input type for the summarizePatientHistory function.
 * - SummarizePatientHistoryOutput - The return type for the summarizePatientHistory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizePatientHistoryInputSchema = z.object({
  patientHistory: z
    .string()
    .describe('The dental history of the patient to summarize.'),
});
export type SummarizePatientHistoryInput = z.infer<
  typeof SummarizePatientHistoryInputSchema
>;

const SummarizePatientHistoryOutputSchema = z.object({
  summary: z
    .string()
    .describe('A summary of the patient dental history.'),
});
export type SummarizePatientHistoryOutput = z.infer<
  typeof SummarizePatientHistoryOutputSchema
>;

export async function summarizePatientHistory(
  input: SummarizePatientHistoryInput
): Promise<SummarizePatientHistoryOutput> {
  return summarizePatientHistoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizePatientHistoryPrompt',
  input: {schema: SummarizePatientHistoryInputSchema},
  output: {schema: SummarizePatientHistoryOutputSchema},
  prompt: `You are an expert dentist. Please summarize the following patient dental history. The summary should be concise and include all the important details about past treatments and conditions.\n\nPatient History: {{{patientHistory}}}`,
});

const summarizePatientHistoryFlow = ai.defineFlow(
  {
    name: 'summarizePatientHistoryFlow',
    inputSchema: SummarizePatientHistoryInputSchema,
    outputSchema: SummarizePatientHistoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
