'use server';

// import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Message } from '@/types/chat';

/**
 * Server Action para enviar mensajes al chat API
 * Esta función se ejecuta en el servidor y maneja el contexto de Cloudflare
 */
export async function sendChatMessage(messages: Message[]) {
    try {
        // Obtener el contexto de Cloudflare
        // const { env } = getCloudflareContext();
        // const { NEXTJS_AI } = env;

        // console.log('Server env:', NEXTJS_AI);


        const AI_URL = process.env.NEXTJS_AI_API;
        if (!AI_URL) {
            throw new Error('NEXTJS_AI_API environment variable is not defined');
        }

        const response = await fetch(`${AI_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages }),
        });

        console.log('response:', response);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error('Error in sendChatMessage server action:', error);
        throw error;
    }
} 