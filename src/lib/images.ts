"use client"

export interface ImageUploadResponse {
    id: string;
    url: string;
}

export const submitImages = async (image: File): Promise<ImageUploadResponse> => {


    const IMAGE_URL = process.env.NEXT_PUBLIC_AI_URL;

    if (!IMAGE_URL) {
        throw new Error("NEXTJS_AI_API environment variable is not defined");
    }

    const response = await fetch(`${IMAGE_URL}/api/images`, {
        method: "PUT",
        headers: {
            "Content-Type": image.type,
        },
        body: image,
    });

    const json = await response.json();

    return json as ImageUploadResponse;
}
