import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

import { useDialogFocus } from '../../app/useDialogFocus';
import {
  defaultNavSettings,
  defaultTheme,
  NAV_SETTINGS_CHANGED_EVENT,
  readNavSettings,
  readTheme,
  writeTheme,
  writeNavSettings,
  type NavItemId,
  type ThemeValues,
} from './customizerSettings';
import { colorFromDrag, hexToHsl, normalizeHex, type HslColor } from './colorDrag';
import { resolveThemePresetName, themePresets } from './themePresets';
import styles from './CustomizerPanel.module.css';

const labels: Record<keyof ThemeValues, string> = {
  plum: 'Primary',
  lavender: 'Quiet',
  ink: 'Text',
  inkSoft: 'Secondary',
  rose: 'Action',
  mint: 'Positive',
  gold: 'Attention',
  sky: 'Selection',
  outline: 'Outline',
};

const colorAriaLabels: Record<keyof ThemeValues, string> = {
  plum: 'Primary emphasis',
  lavender: 'Quiet emphasis',
  ink: 'Primary foreground',
  inkSoft: 'Secondary foreground',
  rose: 'Action emphasis',
  mint: 'Positive emphasis',
  gold: 'Attention emphasis',
  sky: 'Selection emphasis',
  outline: 'Structural contrast',
};

const navLabels: Array<[NavItemId, string]> = [
  ['home', 'Home'], ['customizer', 'Customizer'],
  ['journal', 'Journal'], ['inventory', 'Inventory'], ['observations', 'Observations'],
  ['fauxFeelings', 'Faux feelings'], ['feelings', 'Feelings'], ['needs', 'Needs'],
  ['bodyCues', 'Body cues'], ['journalDashboard', 'History'],
];

type CustomizerPanelProps = { onClose: () => void };

type SwatchDrag = {
  key: keyof ThemeValues;
  pointerId: number;
  startX: number;
  startY: number;
  startHsl: HslColor;
  startHex: string;
  previewHex: string;
  moved: boolean;
};

type TiltPermissionState = {
  available: boolean;
  supported: boolean;
  state: 'unknown' | 'granted' | 'denied';
  pending: boolean;
};

type OrientationLockTarget = 'portrait' | 'landscape';

type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: OrientationLockTarget) => Promise<void>;
  unlock?: () => void;
};

type OrientationLockState = {
  mobile: boolean;
  available: boolean;
  locked: boolean;
  pending: boolean;
  error: boolean;
  target: OrientationLockTarget | null;
};

let orientationLockSession: Pick<OrientationLockState, 'locked' | 'target'> = {
  locked: false,
  target: null,
};

function detectTiltPermission(): TiltPermissionState {
  const orientation = typeof window === 'undefined' ? undefined : window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
    requestPermission?: () => Promise<'granted' | 'denied'>;
  };
  const available = typeof orientation !== 'undefined';
  const supported = available && typeof orientation.requestPermission === 'function';
  return { available, supported, state: available && !supported ? 'granted' : 'unknown', pending: false };
}

function tiltPresentation(tilt: TiltPermissionState) {
  if (!tilt.available) return { label: '—', status: 'Tilt is not supported on this device.', disabled: true };
  if (tilt.pending) return { label: '…', status: 'Waiting for permission.', disabled: true };
  if (tilt.state === 'granted') return {
    label: '✓',
    status: tilt.supported ? 'Tilt is active.' : 'Tilt works automatically.',
    disabled: !tilt.supported,
  };
  if (tilt.state === 'denied') return { label: 'Retry', status: 'Permission denied.', disabled: false };
  return { label: 'Allow', status: 'Move magnets by tilting your phone.', disabled: false };
}

function isMobileLikeDevice() {
  if (typeof window === 'undefined') return false;
  return navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
}

function getLockableOrientation() {
  if (typeof screen === 'undefined' || !screen.orientation) return null;
  return screen.orientation as LockableScreenOrientation;
}

function currentOrientationTarget(orientation: LockableScreenOrientation | null): OrientationLockTarget {
  if (orientation?.type?.startsWith('landscape')) return 'landscape';
  if (orientation?.type?.startsWith('portrait')) return 'portrait';
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
}

function detectOrientationLock(): OrientationLockState {
  const mobile = isMobileLikeDevice();
  const orientation = getLockableOrientation();
  return {
    mobile,
    available: mobile && typeof orientation?.lock === 'function' && typeof orientation?.unlock === 'function',
    locked: orientationLockSession.locked,
    pending: false,
    error: false,
    target: orientationLockSession.target,
  };
}

function orientationLockPresentation(lock: OrientationLockState) {
  if (!lock.available) return {
    label: '—',
    status: 'Not supported in this browser.',
    disabled: true,
  };
  if (lock.pending) return { label: '…', status: 'Locking current orientation.', disabled: true };
  if (lock.error) return {
    label: 'Retry',
    status: 'Browser blocked orientation lock.',
    disabled: false,
  };
  if (lock.locked) return {
    label: '✓',
    status: `Locked to ${lock.target ?? 'current'} orientation.`,
    disabled: false,
  };
  return {
    label: 'Off',
    status: 'Keep the current screen orientation.',
    disabled: false,
  };
}

function PresetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 1.1 3.2L16 7.5l-2.9 1.3L12 12l-1.1-3.2L8 7.5l2.9-1.3L12 3Z" />
      <path d="m18 13 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8L18 13Z" />
      <path d="m6 13 .7 1.8 1.8.7-1.8.7L6 18l-.7-1.8-1.8-.7 1.8-.7L6 13Z" />
    </svg>
  );
}

function CornersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10V8a4 4 0 0 1 4-4h2" />
      <path d="M14 4h2a4 4 0 0 1 4 4v2" />
      <path d="M20 14v2a4 4 0 0 1-4 4h-2" />
      <path d="M10 20H8a4 4 0 0 1-4-4v-2" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="8" r="2" />
      <circle cx="16" cy="8" r="2" />
      <circle cx="8" cy="16" r="2" />
      <circle cx="16" cy="16" r="2" />
    </svg>
  );
}

function NavigationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="5" width="16" height="4" rx="2" />
      <rect x="4" y="11" width="7" height="4" rx="2" />
      <rect x="13" y="11" width="7" height="4" rx="2" />
      <rect x="4" y="17" width="16" height="2" rx="1" />
    </svg>
  );
}

function TiltIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="7" y="3" width="10" height="18" rx="2.2" />
      <path d="M10 17.5h4" />
      <path d="M4.5 8.5 3 10l1.5 1.5M19.5 8.5 21 10l-1.5 1.5" />
    </svg>
  );
}

function OrientationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7.5 9.5a5 5 0 0 1 8.8-2.7L18 8.5" />
      <path d="M18 5v3.5h-3.5" />
      <rect x="8.2" y="11" width="7.6" height="7" rx="1.5" />
      <path d="M10 11V9.8a2 2 0 0 1 4 0V11" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7v5h5" />
      <path d="M5.2 16.5a8 8 0 1 0 .5-9.5L4 9" />
    </svg>
  );
}

export function CustomizerPanel({ onClose }: CustomizerPanelProps) {
  const initial = readTheme();
  const initialPreset = resolveThemePresetName(initial);
  const [values, setValues] = useState<ThemeValues>(initial.values);
  const [roundness, setRoundness] = useState(initial.roundness);
  const [preset, setPreset] = useState(initialPreset);
  const [navSettings, setNavSettings] = useState(readNavSettings);
  const [tiltPermission, setTiltPermission] = useState(detectTiltPermission);
  const [orientationLock, setOrientationLock] = useState(detectOrientationLock);
  const swatchDrag = useRef<SwatchDrag | null>(null);
  const suppressSwatchClick = useRef(false);
  const nativePickers = useRef<Partial<Record<keyof ThemeValues, HTMLInputElement | null>>>({});
  const panelRef = useDialogFocus<HTMLElement>({ open: true, onClose, modal: false });

  useEffect(() => {
    writeTheme({ values, roundness, preset });
  }, [preset, roundness, values]);

  useEffect(() => {
    try { writeNavSettings(navSettings); } catch { window.dispatchEvent(new CustomEvent(NAV_SETTINGS_CHANGED_EVENT, { detail: navSettings })); }
  }, [navSettings]);

  function updateHex(key: keyof ThemeValues, raw: string) {
    const next = normalizeHex(raw);
    if (next) { setValues((current) => ({ ...current, [key]: next })); setPreset(''); }
  }

  function choosePreset(name: string) {
    const match = themePresets.find((candidate) => candidate.name === name);
    if (!match) { setPreset(''); return; }
    setPreset(match.name);
    setValues({ ...match.values });
    setRoundness(match.roundness);
  }

  function beginSwatchDrag(event: ReactPointerEvent<HTMLButtonElement>, key: keyof ThemeValues) {
    if (event.button !== 0) return;
    const startHex = values[key];
    const startHsl = hexToHsl(startHex);
    if (!startHsl) return;
    event.preventDefault();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer capture is optional. */ }
    swatchDrag.current = {
      key,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startHsl,
      startHex,
      previewHex: startHex,
      moved: false,
    };
  }

  function moveSwatch(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = swatchDrag.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    const nextHex = colorFromDrag(drag.startHsl, deltaX, deltaY, event.shiftKey);
    if (nextHex === drag.previewHex) return;
    drag.previewHex = nextHex;
    drag.moved = true;
    setValues((current) => ({ ...current, [drag.key]: nextHex }));
    setPreset('');
  }

  function finishSwatchDrag(event: ReactPointerEvent<HTMLButtonElement>, commit: boolean) {
    const drag = swatchDrag.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* Pointer capture is optional. */ }
    if (!commit) setValues((current) => ({ ...current, [drag.key]: drag.startHex }));
    suppressSwatchClick.current = drag.moved || !commit;
    swatchDrag.current = null;
  }

  function openNativePicker(key: keyof ThemeValues) {
    if (suppressSwatchClick.current) {
      suppressSwatchClick.current = false;
      return;
    }
    nativePickers.current[key]?.click();
  }

  function unlockOrientation() {
    const orientation = getLockableOrientation();
    try { orientation?.unlock?.(); } catch { /* Unlock support can disappear after a browser mode change. */ }
    orientationLockSession = { locked: false, target: null };
    setOrientationLock((current) => ({ ...current, locked: false, pending: false, error: false, target: null }));
  }

  function reset() {
    setValues({ ...defaultTheme });
    setRoundness(100);
    setPreset('Default');
    setNavSettings({ ...defaultNavSettings });
    if (orientationLock.locked) unlockOrientation();
  }

  async function requestTilt() {
    if (!tiltPermission.available || tiltPermission.pending) return;
    const orientation = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };
    if (!orientation) return;
    setTiltPermission((current) => ({ ...current, pending: true }));
    try {
      const permission = typeof orientation.requestPermission === 'function' ? await orientation.requestPermission() : 'granted';
      setTiltPermission((current) => ({ ...current, state: permission, pending: false }));
      if (permission === 'granted') window.dispatchEvent(new CustomEvent('allneeds:tilt-permission-granted'));
    } catch { setTiltPermission((current) => ({ ...current, state: 'denied', pending: false })); }
  }

  async function toggleOrientationLock() {
    if (!orientationLock.available || orientationLock.pending) return;
    if (orientationLock.locked) {
      unlockOrientation();
      return;
    }

    const orientation = getLockableOrientation();
    if (!orientation?.lock) return;
    const target = currentOrientationTarget(orientation);
    setOrientationLock((current) => ({ ...current, pending: true, error: false, target }));
    try {
      await orientation.lock(target);
      orientationLockSession = { locked: true, target };
      setOrientationLock((current) => ({ ...current, locked: true, pending: false, error: false, target }));
    } catch {
      orientationLockSession = { locked: false, target: null };
      setOrientationLock((current) => ({ ...current, locked: false, pending: false, error: true, target: null }));
    }
  }

  function deleteLocalData() {
    if (!window.confirm('Delete all allneeds.app data stored on this local origin? Export a backup first if you want to keep it.')) return;
    window.localStorage.clear();
    window.sessionStorage.clear();
    reset();
    window.dispatchEvent(new CustomEvent('allneeds:inventory-changed', { detail: { count: 0 } }));
    window.dispatchEvent(new CustomEvent('allneeds:journal-changed', { detail: { count: 0 } }));
  }

  const tilt = tiltPresentation(tiltPermission);
  const orientation = orientationLockPresentation(orientationLock);

  return (
    <section ref={panelRef} className={styles.panel} role="dialog" aria-modal="false" aria-labelledby="customizer-title" tabIndex={-1}>
      <header className={styles.header}>
        <p id="customizer-title" className={styles.title}>Customizer</p>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close customizer" data-dialog-initial-focus>×</button>
      </header>

      <div className={styles.scrollBody} data-customizer-scroll-body>
        <section className={styles.settingsGroup} aria-label="Appearance">
          <label className={styles.settingsRow}>
            <span className={styles.rowIcon}><PresetIcon /></span>
            <span className={styles.rowCopy}><span>Preset</span></span>
            <select className={styles.compactSelect} value={preset} onChange={(event) => choosePreset(event.target.value)}>
              <option value="">Current colors</option>
              {themePresets.map((themePreset) => <option key={themePreset.name} value={themePreset.name}>{themePreset.name}</option>)}
            </select>
          </label>

          <label className={styles.settingsRow}>
            <span className={styles.rowIcon}><CornersIcon /></span>
            <span className={styles.rowCopy}><span>Corners</span><output>{roundness}%</output></span>
            <input className={styles.inlineRange} type="range" min="0" max="200" value={roundness} aria-label={`Corner roundness ${roundness}%`} onChange={(event) => { setRoundness(Number(event.target.value)); setPreset(''); }} />
          </label>
        </section>

        <section className={styles.compactSection} aria-labelledby="colors-title">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}><PaletteIcon /></span>
            <h2 id="colors-title">Colors</h2>
            <small>Tap swatch · edit hex</small>
          </div>
          <div className={styles.colors}>
            {(Object.keys(values) as Array<keyof ThemeValues>).map((key) => (
              <div key={key} className={styles.colorField}>
                <span className={styles.colorLabel}>{labels[key]}</span>
                <button type="button" className={styles.swatch} style={{ backgroundColor: values[key] }} aria-label={`Adjust ${colorAriaLabels[key]} color. Drag to change it, or click to open the color picker.`} onPointerDown={(event) => beginSwatchDrag(event, key)} onPointerMove={moveSwatch} onPointerUp={(event) => finishSwatchDrag(event, true)} onPointerCancel={(event) => finishSwatchDrag(event, false)} onClick={() => openNativePicker(key)} />
                <input ref={(element) => { nativePickers.current[key] = element; }} className={styles.nativePicker} type="color" value={values[key]} tabIndex={-1} hidden onChange={(event) => { setValues((current) => ({ ...current, [key]: event.target.value.toUpperCase() })); setPreset(''); }} />
                <input className={styles.hexInput} key={values[key]} type="text" defaultValue={values[key]} aria-label={colorAriaLabels[key]} maxLength={7} pattern="^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$" title="Use a hex color like #A1B2C3" onBlur={(event) => updateHex(key, event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
              </div>
            ))}
          </div>
        </section>

        <section className={styles.compactSection} aria-labelledby="navigation-title">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}><NavigationIcon /></span>
            <h2 id="navigation-title">Navigation</h2>
            <small>Menu always on</small>
          </div>
          <div className={styles.navGrid}>
            {navLabels.map(([key, label]) => (
              <label key={key} className={styles.navOption}>
                <span>{label}</span>
                <input type="checkbox" role="switch" checked={navSettings[key]} onChange={(event) => setNavSettings((current) => ({ ...current, [key]: event.target.checked }))} />
                <span className={styles.toggleTrack} aria-hidden="true" />
              </label>
            ))}
          </div>
        </section>

        <section className={styles.deviceControls} aria-label="Device controls">
          <div className={styles.deviceControl} data-state={tiltPermission.pending ? 'pending' : tiltPermission.state}>
            <span className={styles.deviceIcon}><TiltIcon /></span>
            <div className={styles.deviceCopy}><h3 id="tilt-title">Device tilt</h3><p id="tilt-description" role="status">{tilt.status}</p></div>
            <button type="button" className={styles.controlAction} role="switch" aria-label="Device tilt access" aria-checked={tiltPermission.state === 'granted'} aria-describedby="tilt-description" disabled={tilt.disabled} onClick={requestTilt}>{tilt.label}</button>
          </div>
          {orientationLock.mobile ? (
            <div className={styles.deviceControl} data-state={orientationLock.error ? 'error' : orientationLock.pending ? 'pending' : orientationLock.locked ? 'granted' : 'unknown'}>
              <span className={styles.deviceIcon}><OrientationIcon /></span>
              <div className={styles.deviceCopy}><h3 id="orientation-lock-title">Orientation lock</h3><p id="orientation-lock-description" role="status">{orientation.status}</p></div>
              <button type="button" className={styles.controlAction} role="switch" aria-label="Lock screen orientation" aria-checked={orientationLock.locked} aria-describedby="orientation-lock-description" disabled={orientation.disabled} onClick={toggleOrientationLock}>{orientation.label}</button>
            </div>
          ) : null}
        </section>

        <footer className={styles.footer}>
          <button type="button" className={styles.resetAction} onClick={reset}><ResetIcon /><span>Reset</span></button>
          <button type="button" className={styles.delete} onClick={deleteLocalData}>Delete local storage</button>
        </footer>
      </div>
    </section>
  );
}
