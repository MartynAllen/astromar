import { useCallback, useState } from "react";
import { Box, Button, Card, Stack, Text } from "@sanity/ui";
import { set, useClient, useFormValue, type ObjectInputProps } from "sanity";
import { parseFilename } from "../../../lib/astro/parseFilename";

const API_VERSION = "2025-01-01";

type Status = "idle" | "loading" | "done" | "no-match" | "no-image";

interface MainImageValue {
  asset?: { _ref?: string };
}

/**
 * Wraps the default shotDetails object input with an "Autofill from
 * filename" button. Reads the uploaded asset's originalFilename and runs it
 * through the same parser the import script uses, then merges the result
 * into the existing shotDetails value — nothing here is silent/automatic,
 * every field stays editable afterward.
 */
export default function ShotDetailsAutofill(props: ObjectInputProps) {
  const client = useClient({ apiVersion: API_VERSION });
  const mainImage = useFormValue(["mainImage"]) as MainImageValue | undefined;
  const [status, setStatus] = useState<Status>("idle");

  const handleAutofill = useCallback(async () => {
    const assetId = mainImage?.asset?._ref;
    if (!assetId) {
      setStatus("no-image");
      return;
    }
    setStatus("loading");
    const asset = await client.getDocument<{ originalFilename?: string }>(assetId);
    const filename = asset?.originalFilename;
    const parsed = filename ? parseFilename(filename) : null;
    if (!parsed) {
      setStatus("no-match");
      return;
    }

    const current = (props.value ?? {}) as Record<string, unknown>;
    const merged = {
      ...current,
      targetCatalogId: parsed.targetCatalogId,
      targetCommonName: parsed.targetCommonName ?? current.targetCommonName,
      ...(parsed.subCount ? { subCount: parsed.subCount } : {}),
      ...(parsed.subExposureSeconds
        ? { subExposureSeconds: parsed.subExposureSeconds }
        : {}),
      ...(parsed.filter ? { filter: parsed.filter } : {}),
      isMosaic: parsed.isMosaic,
      ...(parsed.captureDate ? { captureDate: parsed.captureDate } : {}),
    };
    props.onChange(set(merged));
    setStatus("done");
  }, [client, mainImage, props]);

  return (
    <Stack gap={3}>
      <Card padding={3} radius={2} tone="primary" border>
        <Stack gap={3}>
          <Text size={1}>
            Reads the uploaded file&apos;s original filename against Astromar&apos;s
            Seestar naming convention and pre-fills the fields below. Everything
            stays editable after.
          </Text>
          <Box>
            <Button
              text={status === "loading" ? "Reading filename…" : "Autofill from filename"}
              tone="primary"
              mode="ghost"
              disabled={status === "loading"}
              onClick={handleAutofill}
            />
          </Box>
          {status === "no-match" && (
            <Text size={1} muted>
              Filename didn&apos;t match a known pattern — fill in the fields manually.
            </Text>
          )}
          {status === "no-image" && (
            <Text size={1} muted>
              Upload an image first, then try autofill again.
            </Text>
          )}
        </Stack>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  );
}
