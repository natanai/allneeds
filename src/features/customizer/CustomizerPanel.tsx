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
  plum: 'Canvas glow', lavender: 'Panel mist', ink: 'Ink', inkSoft: 'Soft ink',
  rose: 'Blush accent', mint: 'Mint accent', gold: 'Sunbeam accent', sky: 'Sky accent', outline: 'Outline',
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

export function CustomizerPanel({ onClose }: CustomizerPanelProps) {
  const initial = readTheme();
  const initialPreset = resolveThemePresetName(initial);
  const [values, setValues] = useState<ThemeValues>(initial.values);
  const [roundness, setRoundness] = useState(initial.roundness);
  const [preset, setPreset] = useState(initialPreset);
  const [navSettings, setNavSettings] = useState(readNavSettings);
  const [tiltPermission, setTiltPermission] = useState(detectTiltPermission);
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

  function reset() {
    setValues({ ...defaultTheme }); setRoundness(100); setPreset('Default'); setNavSettings({ ...defaultNavSettings });
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

  function deleteLocalData() {
    if (!window.confirm('Delete all allneeds.app data stored on this local origin? Export a backup first if you want to keep it.')) return;
    window.localStorage.clear();
    window.sessionStorage.clear();
    reset();
    window.dispatchEvent(new CustomEvent('allneeds:inventory-changed', { detail: { count: 0 } }));
    window.dispatchEvent(new CustomEvent('allneeds:journal-changed', { detail: { count: 0 } }));
  }

  const tilt = tiltPresentation(tiltPermission);

  return (
    <section ref={panelRef} className={styles.panel} role="dialog" aria-modal="false" aria-labelledby="customizer-title" tabIndex={-1}>
      <header className={styles.header}><div><p id="customizer-title" className={styles.eyebrow}>Customizer</p><p className={styles.subtitle}>Fine-tune colors, corners, and device controls.</p></div><button type="button" className={styles.close} onClick={onClose} aria-label="Close customizer" data-dialog-initial-focus>×</button></header>

      <div className={styles.scrollBody} data-customizer-scroll-body>
        <label className={styles.preset}><span>Presets</span><select value={preset} onChange={(event) => choosePreset(event.target.value)}><option value="">Current colors</option>{themePresets.map((themePreset) => <option key={themePreset.name} value={themePreset.name}>{themePreset.name}</option>)}</select></label>

        <label className={styles.range}><span>Corner roundness <output>{roundness}%</output></span><input type="range" min="0" max="200" value={roundness} aria-label={`Corner roundness ${roundness}%`} onChange={(event) => { setRoundness(Number(event.target.value)); setPreset(''); }} /></label>

        <div className={styles.colors}>{(Object.keys(values) as Array<keyof ThemeValues>).map((key) => <div key={key} className={styles.colorField}><span>{labels[key]}</span><div><button type="button" className={styles.swatch} style={{ backgroundColor: values[key] }} aria-label={`Adjust ${labels[key]} color. Drag to change it, or click to open the color picker.`} onPointerDown={(event) => beginSwatchDrag(event, key)} onPointerMove={moveSwatch} onPointerUp={(event) => finishSwatchDrag(event, true)} onPointerCancel={(event) => finishSwatchDrag(event, false)} onClick={() => openNativePicker(key)} /><input ref={(element) => { nativePickers.current[key] = element; }} className={styles.nativePicker} type="color" value={values[key]} tabIndex={-1} hidden onChange={(event) => { setValues((current) => ({ ...current, [key]: event.target.value.toUpperCase() })); setPreset(''); }} /><input key={values[key]} type="text" defaultValue={values[key]} aria-label={labels[key]} maxLength={7} pattern="^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$" title="Use a hex color like #A1B2C3" onBlur={(event) => updateHex(key, event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} /></div></div>)}</div>

        <fieldset className={styles.navSettings}><legend>Navigation magnets</legend><p>Choose which magnets appear in the top navigation bar.</p><div className={styles.alwaysOn}><span>Menu magnet</span><small>Always on</small></div><div className={styles.alwaysOn}><span>Home magnet</span><small>Always on</small></div><div className={styles.alwaysOn}><span>Customizer magnet</span><small>Always on</small></div>{navLabels.map(([key, label]) => <label key={key}><input type="checkbox" checked={navSettings[key]} onChange={(event) => setNavSettings((current) => ({ ...current, [key]: event.target.checked }))} /><span>{label}</span></label>)}</fieldset>

        <section className={styles.tilt} aria-labelledby="tilt-title" data-state={tiltPermission.pending ? 'pending' : tiltPermission.state}><div><h3 id="tilt-title">Device tilt access</h3><p id="tilt-description">Let magnets respond to how you hold your phone.</p></div><button type="button" role="switch" aria-checked={tiltPermission.state === 'granted'} aria-describedby="tilt-description tilt-status" disabled={tilt.disabled} onClick={requestTilt}>{tilt.label}</button><small id="tilt-status" role="status">{tilt.status}</small></section>

        <footer className={styles.footer}><button type="button" onClick={reset}>Reset to default</button><button type="button" className={styles.delete} onClick={deleteLocalData}>Delete localStorage</button></footer>
      </div>
    </section>
  );
}
