import { Helmet } from "react-helmet";

function Metatags({ metaProps }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "PDF Works",
    image: metaProps.image,
    "@id": "",
    url: metaProps.url,
    telephone: "+91 9715092104",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Prime Plaza No.54/1, 1st street, Sripuram colony",
      addressLocality: "St. Thomas Mount, Chennai",
      postalCode: "600016",
      addressRegion: "Tamil Nadu",
      addressCountry: "IN",
    },

    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
    sameAs: [
      "https://www.instagram.com/cybomb_tech/",
      "https://www.linkedin.com/company/cybomb/",
      "https://x.com/CybombTech",
    ],
  };

  return (
    <Helmet>
      <title>{metaProps.title}</title>
      <meta name="description" content={metaProps.description} />
      <meta name="keywords" content={metaProps.keyword} />
      <meta name="author" content="Cybomb Technologies" />
      <meta name="robots" content="index, follow" />

      {/* Open Graph */}
      <meta property="og:title" content={metaProps.title} />
      <meta property="og:description" content={metaProps.description} />
      <meta property="og:image" content={metaProps.image} />
      <meta property="og:url" content={metaProps.url} />
      <meta property="og:type" content="website" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaProps.title} />
      <meta name="twitter:description" content={metaProps.description} />
      <meta name="twitter:image" content={metaProps.image} />

      {/* Structured Data */}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}

export default Metatags;
