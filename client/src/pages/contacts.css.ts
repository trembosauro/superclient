import { style } from "@vanilla-extract/css";

export const filtersRow = style({
  display: "flex",
  gap: "16px",
  alignItems: "stretch",
  minWidth: 0,
  "@media": {
    "(max-width: 959px)": {
      flexWrap: "wrap",
    },
    "(min-width: 960px)": {
      flexWrap: "nowrap",
    },
  },
});

export const searchWrap = style({
  flex: "0 1 520px",
  minWidth: "240px",
  "@media": {
    "(max-width: 959px)": {
      flex: "1 1 100%",
      maxWidth: "100%",
    },
  },
});

export const searchFieldStable = style({
  selectors: {
    "& input": {
      paddingRight: "48px",
    },
  },
});

export const categoryWrap = style({
  flex: "0 1 360px",
  minWidth: "240px",
  overflow: "hidden",
  "@media": {
    "(max-width: 959px)": {
      flex: "1 1 100%",
      maxWidth: "100%",
    },
  },
});
