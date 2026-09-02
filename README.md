# Bookmark Everywhere

Save the URL you have selected, are browsing, or have copied to every bookmarking service you
connected, with one keypress. No per-service commands.

## URL source

The command takes the first of these that gives a valid `http`/`https` URL:

1. The current text selection.
2. The active tab, through the Raycast Browser Extension.
3. The clipboard.

The whole selection must be a URL. A URL inside a sentence is ignored.

## Targets

| Target | Transport | Needs |
| --- | --- | --- |
| GoodLinks | `open -g -j goodlinks://x-callback-url/save` with `quick=1` | GoodLinks installed |
| Pinboard | `GET api.pinboard.in/v1/posts/add` | API token from [pinboard.in/settings/password](https://pinboard.in/settings/password), in the form `username:XXXXXXXX` |
| Readwise Reader | `POST readwise.io/api/v3/save/` | Access token from [readwise.io/access_token](https://readwise.io/access_token) |

Targets run in parallel. A failure in one does not stop the others: the result message names which
target saved and which did not.

Saving never takes focus. The command shows no UI while it works, then a HUD naming the targets that
saved. Only a failure raises a toast, which stays up long enough to read the reason. GoodLinks is
handed its URL through `open -g -j`, which keeps it in the background and hidden, rather than through
the Raycast `open` API, which activates the app.

GoodLinks and Readwise Reader fetch the page metadata themselves, so the extension sends a title only
when it already has a reliable one from the browser tab. Pinboard requires a title, so when Pinboard
is on the extension reads the page `<title>` first, with a 5 second timeout, and falls back to the
URL. With Pinboard off, no page fetch happens at all.

Tags are written in each service's own shape: space separated for GoodLinks and Pinboard, a JSON
array for Readwise.

## Adding another service

Every service is one adapter that implements the `Target` interface in `src/types.ts`.

1. Write `src/targets/<service>.ts`:

   ```ts
   import { Bookmark, Target } from "../types";

   export const service: Target = {
     id: "service",
     name: "Service",
     needsTitle: true,
     isEnabled: (preferences) => preferences.serviceEnabled,
     async save(bookmark, preferences) {
       // Throw an Error with a message the user can act on.
     },
   };
   ```

2. List it in `src/targets/index.ts`.
3. Add its preferences to `package.json`: an `serviceEnabled` checkbox and whatever credentials it
   needs. `npm run build` regenerates the `Preferences` type from that file.

## Development

```sh
npm install
npm run dev     # loads the extension into Raycast
npm run lint
npm run build
```

Assign the hotkey in Raycast under Extensions, Bookmark Everywhere, Bookmark URL.
