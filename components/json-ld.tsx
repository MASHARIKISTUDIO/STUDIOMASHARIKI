/**
 * Renders a JSON-LD document into a <script type="application/ld+json">.
 *
 * Security: gallery titles, descriptions and locations are user-supplied and
 * end up inside this script block. `JSON.stringify` alone does NOT make that
 * safe - a title containing `</script>` would terminate the element early and
 * allow HTML injection. Escaping `<`, `>` and `&` to their \uXXXX forms keeps
 * the payload valid JSON (parsers decode the escapes) while making it
 * impossible to break out of the script element.
 */
function safeJsonLd(data: object): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- required for JSON-LD; payload is escaped above.
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
