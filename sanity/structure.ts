import type { StructureResolver } from "sanity/structure";

const SINGLETON_TYPES = new Set(["siteSettings", "aboutPage"]);
const CATEGORIES: Array<{ title: string; value: string }> = [
  { title: "Deep sky", value: "deep-sky" },
  { title: "Lunar", value: "lunar" },
  { title: "Planetary", value: "planetary" },
  { title: "Wide field", value: "wide-field" },
  { title: "Gear", value: "gear" },
];

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Site Settings")
        .id("siteSettings")
        .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
      S.listItem()
        .title("About Page")
        .id("aboutPage")
        .child(S.document().schemaType("aboutPage").documentId("aboutPage")),
      S.divider(),
      S.listItem()
        .title("Astro Photos")
        .child(
          S.list()
            .title("Astro Photos")
            .items([
              S.listItem()
                .title("All photos")
                .child(
                  S.documentTypeList("astroPhoto")
                    .title("All Photos")
                    .defaultOrdering([{ field: "shotDetails.captureDate", direction: "desc" }]),
                ),
              S.divider(),
              ...CATEGORIES.map((category) =>
                S.listItem()
                  .title(category.title)
                  .child(
                    S.documentTypeList("astroPhoto")
                      .title(category.title)
                      .filter('_type == "astroPhoto" && category == $category')
                      .params({ category: category.value })
                      .defaultOrdering([
                        { field: "shotDetails.captureDate", direction: "desc" },
                      ]),
                  ),
              ),
            ]),
        ),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) =>
          item.getId() !== undefined &&
          !SINGLETON_TYPES.has(item.getId()!) &&
          item.getId() !== "astroPhoto",
      ),
    ]);
