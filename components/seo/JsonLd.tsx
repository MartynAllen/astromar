export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- JSON-LD must be inlined as raw script content
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
