// UI strings for the shell and the globe (Eleder's area). Follows docs/pitch/COPY.md;
// update both together. Placeholder name until Edur's brand brief lands.
export const shellCopy = {
  productName: "Earth Case Files",
  productRole: "Trend recorder",
  about: "About",
  share: "Share case",
  shareShort: "Share",
  shareRest: "case",
  shareCopied: "Link copied. Anyone with it opens this exact case.",
  shareFailed: "Couldn't copy the link. Copy it from the address bar instead.",
  skipToPanel: "Skip to the case panel",
} as const;

export const globeCopy = {
  windowLabel: "Viewing window",
  placeholder: "The globe is being installed in this window.",
  loading: "Warming up the globe…",
  searchTrigger: "Find a place",
  searchPlaceholder: "Country, US state, ocean or region…",
  searchEmpty: "No region with that name. Try a country or US state.",
  searchUnavailable: "Region list unavailable. Click the globe instead.",
  groupCountry: "Countries",
  groupState: "US states",
  groupOcean: "Ocean basins",
  groupNamed: "Named regions",
  selectedPen: "In the case",
  noWebgl: "This browser can't draw the 3D globe. Use the search box to choose regions.",
  maxRegions: "Four pens is the limit. Remove a region to add another.",
} as const;
