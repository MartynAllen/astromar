import { type SchemaTypeDefinition } from "sanity";

import astroPhoto from "./documents/astroPhoto";
import reviewPost from "./documents/reviewPost";
import discussionPost from "./documents/discussionPost";
import guideArticle from "./documents/guideArticle";
import calendarEvent from "./documents/calendarEvent";
import siteSettings from "./documents/siteSettings";
import aboutPage from "./documents/aboutPage";

import shotDetails from "./objects/shotDetails";
import seo from "./objects/seo";
import affiliateLink from "./objects/affiliateLink";
import gearItem from "./objects/gearItem";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // Documents
    astroPhoto,
    reviewPost,
    discussionPost,
    guideArticle,
    calendarEvent,
    siteSettings,
    aboutPage,
    // Objects
    shotDetails,
    seo,
    affiliateLink,
    gearItem,
  ],
};
