# Bookmark Everywhere Changelog

## [Initial Version] - 2026-09-02

- Bookmark the selected text, active browser tab, or clipboard URL to every enabled service with one
  keypress, taking the first of those three that gives an `http` or `https` URL.
- Save to GoodLinks through its URL scheme, to Pinboard through `posts/add`, and to Readwise Reader
  through `v3/save`. Each service is a `Target` adapter, so connecting another one is a new file and
  a line in `src/targets/index.ts`.
- Run every target in parallel. One failing service does not stop the others, and the result names
  which saved and which did not.
- Take no focus while saving: GoodLinks is handed its URL with `open -g -j`, and the command shows no
  UI until it reports the result.
- Read the page title only when an enabled target needs one, since GoodLinks and Readwise Reader
  fetch their own metadata and Pinboard does not.
