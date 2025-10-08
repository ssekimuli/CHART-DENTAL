
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-treatment-plan.ts';
import '@/ai/flows/summarize-patient-history.ts';
import '@/ai/flows/speak.ts';
