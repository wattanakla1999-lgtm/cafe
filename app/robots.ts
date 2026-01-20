import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://justcafesystem.xyz';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/'], // Disallow sensitive paths
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
