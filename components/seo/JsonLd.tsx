// JSON.stringify doesn't escape "<", so a CMS field containing the literal
// text "</script>" would close this tag early and let whatever follows run
// as HTML/script — a well-known JSON-LD injection vector. Escaping "<" to
// its unicode form keeps the JSON valid while making that breakout
// impossible, without needing to touch the other two dangerous characters.
function safeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
