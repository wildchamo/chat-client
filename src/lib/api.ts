"use client";

// Importación de tipos necesarios para el chat y respuestas de imágenes
import { Message, ChatResponse } from '@/types/chat';
// ImageGenerationResponse

/**
 * @fileoverview API Client para la comunicación con el backend de Platzi Vision
 * 
 * Este módulo proporciona la interfaz principal para la comunicación entre el frontend
 * y el servidor de PlatziVision. Maneja específicamente:
 * 
 * - Comunicación en tiempo real con el servidor mediante Server-Sent Events (SSE)
 * - Procesamiento de mensajes del chat con streaming de respuestas
 * - Manejo de estados para la generación de imágenes
 * 
 * Interactúa con los siguientes componentes:
 * - Components/Chat: Utiliza este cliente para enviar/recibir mensajes
 * - Types/chat.ts: Define las interfaces Message y ChatResponse utilizadas aquí
 * - PlatziVision API: Se comunica con los endpoints de chat y generación de imágenes
 * 
 * El flujo típico de datos es:
 * 1. El usuario envía un mensaje
 * 2. El mensaje se transmite al servidor vía POST
 * 3. El servidor responde con un stream de datos que puede incluir:
 *    - Texto generado progresivamente
 *    - Estados de generación de imágenes
 *    - Mensajes de finalización
 * 
 * @see {@link Message} para la estructura de los mensajes
 * @see {@link ChatResponse} para los tipos de respuesta posibles
 */

export const chatApi = {
    // Función principal para enviar mensajes al API
    // Acepta un array de mensajes y una función opcional para manejar chunks de respuesta
    sendMessage: async (messages: Message[], onChunk: (chunk: ChatResponse) => void): Promise<ChatResponse> => {

        const AI_URL = process.env.NEXT_PUBLIC_AI_URL;

        if (!AI_URL) {
            throw new Error("NEXTJS_AI_API environment variable is not defined");
        }

        const response = await fetch(`${AI_URL}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ messages }),
        });

        // Configuración para lectura de stream de datos
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedMessage = ''; // Almacena el mensaje completo
        let buffer = ''; // Buffer para líneas incompletas

        if (!reader) throw new Error('Failed to get response reader');

        // Bucle principal para procesar el stream de datos
        while (true) {
            // Lee chunks de datos del stream
            const { done, value } = await reader.read();
            if (done) break;

            // Decodifica y agrega al buffer
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');

            // Mantén la última línea en el buffer si no termina en \n
            buffer = lines.pop() || '';

            // Procesa cada línea completa
            for (const line of lines) {
                const trimmedLine = line.trim();

                // Ignora líneas vacías
                if (!trimmedLine) continue;

                // Maneja la señal de finalización
                if (trimmedLine === 'data: [DONE]') {
                    onChunk({ content: accumulatedMessage, status: 'done' });
                    return { content: accumulatedMessage, status: 'done' };
                }

                // Procesa líneas de datos SSE
                if (trimmedLine.startsWith('data: ')) {
                    const jsonStr = trimmedLine.slice(6);

                    // Ignora líneas vacías de datos
                    if (!jsonStr || jsonStr === '') continue;

                    try {
                        const data = JSON.parse(jsonStr);

                        // El servidor envía { content: "texto" } para cada chunk
                        if (data.content) {
                            // Acumula el contenido del mensaje
                            accumulatedMessage += data.content;
                            // Notifica el contenido acumulado
                            onChunk({ content: accumulatedMessage, status: 'streaming' });
                        }
                    } catch (e) {
                        // Solo logea el error si no es un JSON vacío o malformado esperado
                        if (jsonStr !== '[DONE]' && jsonStr.length > 0) {
                            console.log(e);
                            console.warn('Failed to parse SSE chunk (may be incomplete):', jsonStr);
                        }
                    }
                }
            }
        }

        // Retorna el mensaje acumulado si el stream termina
        return { content: accumulatedMessage, status: 'done' };
    },
};
