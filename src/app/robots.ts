import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://26kado.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/auth/",
          "/_next/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/dashboard/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}