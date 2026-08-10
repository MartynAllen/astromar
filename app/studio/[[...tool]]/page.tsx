export { metadata, viewport } from "next-sanity/studio";

import StudioClient from "./StudioClient";

// Studio's config/schema import chain must stay entirely inside a Client
// Component — pulling it into the server compilation graph (e.g. by
// importing sanity.config.ts directly in this Server Component) breaks on
// a swr "react-server" conditional export that Studio's internals hit.
export default function StudioPage() {
  return <StudioClient />;
}
