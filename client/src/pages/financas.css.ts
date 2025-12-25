import { style } from "@vanilla-extract/css";

export const filtersRow = style({
  display: "flex",
  gap: "var(--md-sys-spacing-16, 16px)",
  alignItems: "stretch",
  width: "100%",
  minWidth: 0,
  flexWrap: "wrap",
  "@media": {
    "(min-width: 960px)": {
      flexWrap: "nowrap",
    },
  },
});

export const searchWrap = style({
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
  "@media": {
    "(max-width: 959px)": {
      flex: "1 1 100%",
      maxWidth: "100%",
    },
    "(min-width: 960px)": {
      flex: "0 0 520px",
      maxWidth: "520px",
    },
  },
  selectors: {
    "& > *": {
      width: "100%",
      minWidth: 0,
      maxWidth: "100%",
      boxSizing: "border-box",
      display: "block",
    },
    "& > * > *": {
      width: "100%",
      minWidth: 0,
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
  boxSizing: "border-box",
  "@media": {
    "(max-width: 959px)": {
      flex: "1 1 100%",
      maxWidth: "100%",
    },
    "(min-width: 960px)": {
      flex: "0 0 360px",
      maxWidth: "360px",
    },
  },
  selectors: {
    "& > *": {
      width: "100%",
      minWidth: 0,
      maxWidth: "100%",
      boxSizing: "border-box",
    },
    "& :global(.MuiAutocomplete-root)": {
      width: "100%",
      minWidth: 0,
    },
    "& :global(.MuiAutocomplete-inputRoot)": {
      width: "100%",
      minWidth: 0,
    },
    "& :global(.MuiAutocomplete-input)": {
      minWidth: 0,
    },
    "& :global(.MuiOutlinedInput-root)": {
      width: "100%",
      minWidth: 0,
    },
  },
});
