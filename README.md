# Via for Chrome and Firefox

A browser extension client for [Via](../Via), the self-hosted way to send links, text and files
between your devices.

- **Receive**: links open in a new tab, text is copied to the clipboard, and files are saved to
  the browser's downloads folder (or wherever you choose, if you turn on *Ask where to save each
  file*). Every item shows a notification and is kept in a local history.
- **Send**: the toolbar button sends the current page, one or more files, or some text to any
  of your devices and contacts.

## Install (development)

```sh
npm run build        # writes dist/chrome and dist/firefox (no dependencies needed)
```

- **Chrome / Edge**: `chrome://extensions` → *Developer mode* → *Load unpacked* → pick
  `dist/chrome` (or `src/`, which is the Chrome build).
- **Firefox** (140+): `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on* → pick
  `dist/firefox/manifest.json`.

On first install the setup page opens. Enter your server's address, allow the extension to
talk to it, sign in, and give this browser a name. The password is only used to register the
device: the extension keeps the device token, never the password or a session.

## How it works

The extension follows Via's [client guide](../Via/docs/clients.md):

- It registers as a device of type `browser` and stores only its device token.
- The background keeps `GET /v1/inbox/events` open with `fetch()` (`EventSource` can't send the
  token) and syncs the inbox on `ready` and `push`. It reconnects with backoff. A 1-minute alarm
  restarts it and syncs whenever the browser suspends the background.
- Items are acked only once handled. Files are acked when the download finishes and its size
  matches. A cancelled save dialog also acks. A failed download is retried twice, then waits for
  *Retry* in the history.
- Handling is idempotent on the item id, recalled items cancel their download, and a revoked
  device signs out with a notification.
- Only `https` links from your own devices open automatically. Links from contacts or over plain
  `http` wait for a click on the notification or in the history. Text from contacts isn't
  copied automatically.
- File names are sanitized before saving, and everything is displayed as text, never HTML.

Renaming this browser uses `PATCH /v1/devices/me` with the device token. On older servers
without it, the settings page asks for the password and uses a short-lived session. Removing
the browser always needs the password, since only the account can delete devices.

### Browser differences

| | Chrome | Firefox |
|---|---|---|
| Background | service worker (kept alive while the stream is open) | event page |
| Clipboard | offscreen document | background page |
| Send file | in the popup | in a small window, because Firefox closes popups when the file picker opens |

## Permissions

| Permission | Why |
|---|---|
| host access to your server (asked at setup) | talk to the Via API; nothing else |
| `activeTab` | read the current tab's address and title when you send it |
| `downloads` | save received files |
| `clipboardWrite` (+ `offscreen` on Chrome) | copy received text |
| `notifications` | tell you when something arrives |
| `alarms` | reconnect when the browser suspends the extension |
| `storage` | settings, device token and history, all local |

## Known limits

- Downloads go straight to disk through the browser, so the file's SHA-256 isn't checked; its
  size is.
- Uploads run in the popup: keep it open until the upload finishes.

## Project layout

```
src/
  manifest.json        Chrome manifest; scripts/build.mjs derives the Firefox one
  background.js        stream, sync, handling, notifications
  lib/                 API client, storage, icons, browser namespace
  popup/               toolbar window: Send and History tabs
  options/             onboarding and settings
  offscreen/           Chrome-only clipboard helper
  icons/               copied from Via/branding (app-icon-small-16/32/48, app-icon-128); don't edit
```

## License

AGPL-3.0, like Via.
