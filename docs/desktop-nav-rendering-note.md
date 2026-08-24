# Desktop navigation rendering note

Desktop navigation magnets intentionally use normal `left`/`top` positioning while at rest instead of keeping text inside a permanent transformed/filter compositing layer. This is limited to fine-pointer/hover-capable devices; mobile keeps the transformed magnet physics used for touch and tilt interaction.

A desktop nav magnet only switches back to a transform after pointer movement crosses the drag threshold (`data-dragging=true`). The initial held state remains visually steady and does not use the lifted scale effect. Keyboard focus styling remains unchanged except while a pointer-held magnet is actively marked `data-picked-up=true`.

The mobile Customizer exposes screen orientation lock beside device tilt controls when the device looks touch/mobile-capable. Orientation lock uses the browser Screen Orientation API, is session-only, and reports when the browser blocks or does not support locking rather than claiming a lock succeeded.
