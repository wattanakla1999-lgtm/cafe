/**
 * Compresses an image file if it exceeds the specified size limit.
 * @param file The original file
 * @param maxSizeMB The maximum allowed size in MB (default 5MB)
 * @returns A promise that resolves to the compressed File object (or the original if no compression needed)
 */
export async function compressImage(file: File, maxSizeMB: number = 5): Promise<File> {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size <= maxSizeBytes) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Max dimension strategy: keep aspect ratio, max 1920px (usually good enough for web)
                const MAX_DIMENSION = 1920;

                if (width > height) {
                    if (width > MAX_DIMENSION) {
                        height *= MAX_DIMENSION / width;
                        width = MAX_DIMENSION;
                    }
                } else {
                    if (height > MAX_DIMENSION) {
                        width *= MAX_DIMENSION / height;
                        height = MAX_DIMENSION;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Initial quality check
                // If it's huge, aggressive compression. If barely over, light compression.
                // But generally 0.7-0.8 JPEG quality is a safe bet for significant size reduction.

                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error("Could not compress image"));
                        return;
                    }

                    // Convert blob back to File
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg', // Force convert to JPEG for better compression
                        lastModified: Date.now(),
                    });

                    resolve(compressedFile);
                }, 'image/jpeg', 0.8);
            };

            img.onerror = (err) => reject(err);
        };

        reader.onerror = (err) => reject(err);
    });
}
