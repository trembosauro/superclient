import { style } from "@vanilla-extract/css";

export const filtersRow = style({
  display: "flex",
  alignItems: "stretch",
  gap: "16px",
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
  minWidth: 0,
  "@media": {
    "(max-width: 959px)": {
      flex: "1 1 100%",
      minWidth: "240px",
      maxWidth: "100%",
    },
    "(min-width: 960px)": {
      flex: "0 0 520px",
      maxWidth: "520px",
      minWidth: "320px",
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

export const filterWrap = style({
  minWidth: 0,
  overflow: "hidden",
  "@media": {
    "(max-width: 959px)": {
      flex: "1 1 100%",
      minWidth: "240px",
      maxWidth: "100%",
    },
    "(min-width: 960px)": {
      flex: "0 0 360px",
      maxWidth: "360px",
      minWidth: "240px",
    },
  },
});
