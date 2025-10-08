
'use server';
/**
 * @fileOverview Converts text to speech.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import wav from 'wav';

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const speakFlow = ai.defineFlow(
  {
    name: 'speakFlow',
    inputSchema: z.string(),
    outputSchema: z.object({
      media: z.string().optional(),
    }),
  },
  async query => {
    const {media} = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: query,
    });
    if (!media) {
      return {};
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavData = await toWav(audioBuffer);
    const apiKey = process.env.GEMINI_API_KEY;
    const audioUrl = `data:audio/wav;base64,${wavData}`;

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. Audio playback might fail.");
      return { media: audioUrl };
    }
    
    // The media URL from genkit is temporary and needs the API key to be accessed.
    // By creating a new data URI with the full WAV data, we make it self-contained.
    return {
      media: audioUrl
    };
  }
);

export async function speak(text: string) {
  return await speakFlow(text);
}
