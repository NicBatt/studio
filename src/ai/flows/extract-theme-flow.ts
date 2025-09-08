'use server';
/**
 * @fileOverview An AI flow for extracting theme information from an image.
 *
 * - extractThemeFromImage - A function that analyzes an image of a theme worksheet.
 * - ExtractThemeInput - The input type for the extractThemeFromImage function.
 * - ExtractThemeOutput - The return type for the extractThemeFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractThemeInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a theme worksheet, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractThemeInput = z.infer<typeof ExtractThemeInputSchema>;

const ExtractThemeOutputSchema = z.object({
  theme: z.string().describe('The main title or theme from the worksheet.'),
  description: z.string().describe('The detailed description of the theme.'),
  outcomes: z.array(z.string()).describe('A list of the ideal outcomes or goals.'),
});
export type ExtractThemeOutput = z.infer<typeof ExtractThemeOutputSchema>;

export async function extractThemeFromImage(input: ExtractThemeInput): Promise<ExtractThemeOutput> {
  return extractThemeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractThemePrompt',
  input: {schema: ExtractThemeInputSchema},
  output: {schema: ExtractThemeOutputSchema},
  prompt: `You are an expert at analyzing images of handwritten notes and extracting structured information.
The user has provided an image of a "Theme" worksheet.
Your task is to extract the following information from the image:
1.  The main "Theme" title.
2.  The "Description" of the theme.
3.  A list of all the "Ideal Outcomes".

Analyze the provided image and return the extracted information in the specified JSON format.

Image: {{media url=photoDataUri}}`,
});

const extractThemeFlow = ai.defineFlow(
  {
    name: 'extractThemeFlow',
    inputSchema: ExtractThemeInputSchema,
    outputSchema: ExtractThemeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
