import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://justcafesystem.xyz';

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        // Secure/Private pages shouldn't really be in sitemap if they require login,
        // but if you have a public landing page for them, list it here.
        // Assuming /counter, /reports, /admin are private, we might only list the public facing ones.
    ];
}
