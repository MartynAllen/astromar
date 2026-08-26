import { type SchemaTypeDefinition } from "sanity";

import astroPhoto from "./documents/astroPhoto";
import reviewPost from "./documents/reviewPost";
import guideArticle from "./documents/guideArticle";
import calendarEvent from "./documents/calendarEvent";
import researchProject from "./documents/researchProject";
import siteSettings from "./documents/siteSettings";
import aboutPage from "./documents/aboutPage";
import printProduct from "./documents/printProduct";

import shotDetails from "./objects/shotDetails";
import seo from "./objects/seo";
import affiliateLink from "./objects/affiliateLink";
import gearItem from "./objects/gearItem";
import bodyImage from "./objects/bodyImage";
import reviewGalleryImage from "./objects/reviewGalleryImage";
import printableAccessory from "./objects/printableAccessory";
import recommendedAccessory from "./objects/recommendedAccessory";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // Documents
    astroPhoto,
    reviewPost,
    guideArticle,
    calendarEvent,
    researchProject,
    siteSettings,
    aboutPage,
    printProduct,
    // Objects
    shotDetails,
    seo,
    affiliateLink,
    gearItem,
    bodyImage,
    reviewGalleryImage,
    printableAccessory,
    recommendedAccessory,
  ],
};
