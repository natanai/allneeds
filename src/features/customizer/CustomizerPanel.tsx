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
  plum: 'Canvas glow', lavender: 'Panel mist', surface: 'Raised surface', ink: 'Ink', inkSoft: 'Soft ink',
  rose: 'Blush accent', mint: 'Mint accent', gold: 'Sunbeam accent', peach: 'Journal accent', sky: 'Sky accent', outline: 'Outline',
};

const navLabels: Array<[NavItemId, string]> = [
  ['journal', 'Journal magnet'], ['inventory', 'Inventory magnet'], ['observations', 'Observations magnet'],
  ['fauxFeelings', 'Faux feelings magnet'], ['feelings', 'Feelings magnet'], ['needs', 'Needs magnet'],
  ['bodyCues', 'Body cues magnet'], ['journalDashboard', 'History magnet'],
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
  if (!tilt.available) return { label: 'Unavailable', status: 'Tilt controls are not supported on this device.', disabled: true };
  if (tilt.pending) return { label: 'Requesting…', status: 'Waiting for device permission…', disabled: true };
  if (tilt.state === 'granted') return {
    label: 'On',
    status: tilt.supported ? 'Device tilt control is active.' : 'Tilt responds automatically.',
    disabled: !tilt.supported,
  };
  if (tilt.state === 'denied') return { label: 'Request again', status: 'Permission denied. Tap to try again.', disabled: false };
  return { label: 'Request permission', status: 'Request permission to let magnets follow your device tilt.', disabled: false };
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
    label: 'Unavailable',
    status: 'This browser does not offer screen orientation lock here.',
    disabled: true,
  };
  if (lock.pending) return { label: 'Locking…', status: 'Asking the browser to hold this orientation…', disabled: true };
  if (lock.error) return {
    label: 'Try again',
    status: 'The browser blocked orientation lock. Installed or full-screen mode may be required.',
    disabled: false,
  };
  if (lock.locked) return {
    label: 'On',
    status: `Locked to ${lock.target ?? 'the current'} orientation while this page is open.`,
    disabled: false,
  };
  return {
    label: 'Off',
    status: 'Keep the current screen orientation while you use device tilt.',
    disabled: false,
  };
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
      <header className={styles.header}><div><p id="customizer-title" className={styles.eyebrow}>Customizer</p><p className={styles.subtitle}>Fine-tune colors, corners, and device controls.</p></div><button type="button" className={styles.close} onClick={onClose} aria-label="Close customizer" data-dialog-initial-focus>×</button></header>

      <div className={styles.scrollBody} data-customizer-scroll-body>
        <label className={styles.preset}><span>Presets</span><select value={preset} onChange={(event) => choosePreset(event.target.value)}><option value="">Current colors</option>{themePresets.map((themePreset) => <option key={themePreset.name} value={themePreset.name}>{themePreset.name}</option>)}</select></label>

        <label className={styles.range}><span>Corner roundness <output>{roundness}%</output></span><input type="range" min="0" max="200" value={roundness} aria-label={`Corner roundness ${roundness}%`} onChange={(event) => { setRoundness(Number(event.target.value)); setPreset(''); }} /></label>

        <div className={styles.colors}>{(Object.keys(values) as Array<keyof ThemeValues>).map((key) => <div key={key} className={styles.colorField}><span>{labels[key]}</span><div><button type="button" className={styles.swatch} style={{ backgroundColor: values[key] }} aria-label={`Adjust ${labels[key]} color. Drag to change it, or click to open the color picker.`} onPointerDown={(event) => beginSwatchDrag(event, key)} onPointerMove={moveSwatch} onPointerUp={(event) => finishSwatchDrag(event, true)} onPointerCancel={(event) => finishSwatchDrag(event, false)} onClick={() => openNativePicker(key)} /><input ref={(element) => { nativePickers.current[key] = element; }} className={styles.nativePicker} type="color" value={values[key]} tabIndex={-1} hidden onChange={(event) => { setValues((current) => ({ ...current, [key]: event.target.value.toUpperCase() })); setPreset(''); }} /><input key={values[key]} type="text" defaultValue={values[key]} aria-label={labels[key]} maxLength={7} pattern="^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$" title="Use a hex color like #A1B2C3" onBlur={(event) => updateHex(key, event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} /></div></div>)}</div>

        <fieldset className={styles.navSettings}><legend>Navigation magnets</legend><p>Choose which magnets appear in the top navigation bar.</p><div className={styles.alwaysOn}><span>Menu magnet</span><small>Always on</small></div><div className={styles.alwaysOn}><span>Home magnet</span><small>Always on</small></div><div className={styles.alwaysOn}><span>Customizer magnet</span><small>Always on</small></div>{navLabels.map(([key, label]) => <label key={key}><input type="checkbox" checked={navSettings[key]} onChange={(event) => setNavSettings((current) => ({ ...current, [key]: event.target.checked }))} /><span>{label}</span></label>)}</fieldset>

        <section className={styles.deviceControls} aria-label="Device controls">
          <div className={styles.deviceControl} data-state={tiltPermission.pending ? 'pending' : tiltPermission.state}>
            <div><h3 id="tilt-title">Device tilt access</h3><p id="tilt-description">Let magnets respond to how you hold your phone.</p></div>
            <button type="button" role="switch" aria-label="Device tilt access" aria-checked={tiltPermission.state === 'granted'} aria-describedby="tilt-description tilt-status" disabled={tilt.disabled} onClick={requestTilt}>{tilt.label}</button>
            <small id="tilt-status" role="status">{tilt.status}</small>
          </div>
          {orientationLock.mobile ? (
            <div className={styles.deviceControl} data-state={orientationLock.error ? 'error' : orientationLock.pending ? 'pending' : orientationLock.locked ? 'granted' : 'unknown'}>
              <div><h3 id="orientation-lock-title">Screen orientation lock</h3><p id="orientation-lock-description">Prevent an accidental screen rotation while using tilt.</p></div>
              <button type="button" role="switch" aria-label="Lock screen orientation" aria-checked={orientationLock.locked} aria-describedby="orientation-lock-description orientation-lock-status" disabled={orientation.disabled} onClick={toggleOrientationLock}>{orientation.label}</button>
              <small id="orientation-lock-status" role="status">{orientation.status}</small>
            </div>
          ) : null}
        </section>

        <footer className={styles.footer}><button type="button" onClick={reset}>Reset to default</button><button type="button" className={styles.delete} onClick={deleteLocalData}>Delete localStorage</button></footer>
      </div>
    </section>
  );
}
