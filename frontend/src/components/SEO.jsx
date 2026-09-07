import { Helmet } from "react-helmet-async";

const SITE_NAME = "عقار ويب";
const DEFAULT_DESCRIPTION =
  "ابحث عن شقق وفلل ومكاتب للبيع والإيجار في أفضل المناطق في مصر";
const DEFAULT_IMAGE = "/images/og-default.jpg";

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image,
  url,
  type = "website",
  property,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

  const jsonLd = [];

  if (property) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "Product",
      name: property.title,
      description: property.description || description,
      image: property.image || image || DEFAULT_IMAGE,
      url: url || (typeof window !== "undefined" ? window.location.href : ""),
      offers: {
        "@type": "Offer",
        price: property.price,
        priceCurrency: property.currency || "EGP",
        availability: "https://schema.org/InStock",
      },
      ...(property.location && {
        address: {
          "@type": "PostalAddress",
          addressLocality: property.location,
          addressCountry: "EG",
        },
      }),
    });
  }

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      <link rel="canonical" href={url || (typeof window !== "undefined" ? window.location.href : "")} />
      {jsonLd.map((item, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}
