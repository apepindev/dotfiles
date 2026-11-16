# Local Dev Tape

Draws black and yellow hazard tape along the bottom of tabs showing local
development sites, such as `localhost:5173` or `myapp.test`.

## Requires the Local Dev add-on

CSS cannot see a tab's URL. The Local Dev add-on adds an invisible
zero-width space to the start of local pages' titles, and this mod styles
tabs whose title starts with it. Without the add-on, the mod draws nothing.

The add-on also adds a dev toolbar to local pages: a port switcher, an
error counter, a request log, a storage viewer and an outline toggle.
Which hosts count as local is set in the add-on's settings.

## Settings

- Tape height, as any CSS length. Default `4px`.
- The two stripe colors. Default `#f5c518` and `#111111`.
- Stripe the whole tab, at low opacity, instead of the bottom edge.
