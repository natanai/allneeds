import { useEffect, useState } from 'react';

import { useDialogFocus } from '../../app/useDialogFocus';
import {
  defaultNavSettings,
  defaultTheme,
  NAV_SETTINGS_CHANGED_EVENT,
  palettes,
  readNavSettings,
  readTheme,
  THEME_KEY,
  writeNavSettings,
  type NavItemId,
  type ThemeValues,
} from './customizerSettings';
import styles from './CustomizerPanel.module.css';

const labels: Record<keyof ThemeValues, string> = {
  plum: 'Canvas glow', lavender: 'Panel mist', ink: 'Ink', inkSoft: 'Soft ink',
  rose: 'Blush accent', mint: 'Mint accent', gold: 'Sunbeam accent', sky: 'Sky accent', outline: 'Outline',
};

const variables: Record<keyof ThemeValues, string> = {
  plum: '--plum', lavender: '--lavender', ink: '--ink', inkSoft: '--ink-soft',
  rose: '--rose', mint: '--mint', gold: '--gold', sky: '--sky', outline: '--outline',
};

const navLabels: Array<[NavItemId, string]> = [
  ['journal', 'Journal magnet'], ['inventory', 'Inventory magnet'], ['observations', 'Observations magnet'],
  ['fauxFeelings', 'Faux feelings magnet'], ['feelings', 'Feelings magnet'], ['needs', 'Needs magnet'],
  ['bodyCues', 'Body cues magnet'], ['journalDashboard', 'History magnet'],
];

const hexPattern = /^#[0-9a-f]{6}$/i;

type CustomizerPanelProps = { onClose: () => void };

export function CustomizerPanel({ onClose }: CustomizerPanelProps) {
  const initial = readTheme();
  const [values, setValues] = useState<ThemeValues>(initial.values);
  const [roundness, setRoundness] = useState(initial.roundness);
  const [preset, setPreset] = useState('');
  const [navSettings, setNavSettings] = useState(readNavSettings);
  const [tiltStatus, setTiltStatus] = useState('Device tilt is used automatically when the browser allows it.');
  const panelRef = useDialogFocus<HTMLElement>({ open: true, onClose, modal: false });

  useEffect(() => {
    const root = document.documentElement;
    (Object.keys(values) as Array<keyof ThemeValues>).forEach((key) => root.style.setProperty(variables[key], values[key]));
    root.style.setProperty('--corner-scale', String(roundness / 100));
    root.style.setProperty('--shadow', `color-mix(in srgb, ${values.outline} 55%, transparent)`);
    try { window.localStorage.setItem(THEME_KEY, JSON.stringify({ values, roundness, updatedAt: Date.now() })); } catch { /* Current-page customization still works. */ }
  }, [roundness, values]);

  useEffect(() => {
    try { writeNavSettings(navSettings); } catch { window.dispatchEvent(new CustomEvent(NAV_SETTINGS_CHANGED_EVENT, { detail: navSettings })); }
  }, [navSettings]);

  function updateHex(key: keyof ThemeValues, raw: string) {
    const next = raw.startsWith('#') ? raw : `#${raw}`;
    if (hexPattern.test(next)) { setValues((current) => ({ ...current, [key]: next.toUpperCase() })); setPreset(''); }
  }

  function choosePreset(name: string) {
    setPreset(name);
    const match = palettes.find((palette) => palette.name === name);
    if (match) setValues(match.values);
  }

  function reset() {
    setValues({ ...defaultTheme }); setRoundness(100); setPreset(''); setNavSettings({ ...defaultNavSettings });
  }

  async function requestTilt() {
    const orientation = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };
    if (!orientation) { setTiltStatus('Device orientation is unavailable in this browser.'); return; }
    try {
      const permission = typeof orientation.requestPermission === 'function' ? await orientation.requestPermission() : 'granted';
      setTiltStatus(permission === 'granted' ? 'Device tilt control is active when magnet physics is on.' : 'Device tilt permission was not granted.');
      if (permission === 'granted') window.dispatchEvent(new CustomEvent('allneeds:tilt-permission-granted'));
    } catch { setTiltStatus('Device tilt permission could not be requested.'); }
  }

  function deleteLocalData() {
    if (!window.confirm('Delete all allneeds.app data stored on this local origin? Export a backup first if you want to keep it.')) return;
    window.localStorage.clear();
    reset();
    window.dispatchEvent(new CustomEvent('allneeds:inventory-changed', { detail: { count: 0 } }));
    window.dispatchEvent(new CustomEvent('allneeds:journal-changed', { detail: { count: 0 } }));
    setTiltStatus('Local storage was deleted.');
  }

  return (
    <section ref={panelRef} className={styles.panel} role="dialog" aria-modal="false" aria-labelledby="customizer-title" tabIndex={-1}>
      <header className={styles.header}><div><p id="customizer-title" className={styles.eyebrow}>Customizer</p><p className={styles.subtitle}>Fine-tune colors, corners, and device controls.</p></div><button type="button" className={styles.close} onClick={onClose} aria-label="Close customizer" data-dialog-initial-focus>×</button></header>

      <label className={styles.preset}><span>Presets</span><select value={preset} onChange={(event) => choosePreset(event.target.value)}><option value="">Current colors</option>{palettes.map((palette) => <option key={palette.name} value={palette.name}>{palette.name}</option>)}</select></label>

      <label className={styles.range}><span>Corner roundness <output>{roundness}%</output></span><input type="range" min="0" max="200" value={roundness} aria-label={`Corner roundness ${roundness}%`} onChange={(event) => setRoundness(Number(event.target.value))} /></label>

      <div className={styles.colors}>{(Object.keys(values) as Array<keyof ThemeValues>).map((key) => <label key={key} className={styles.colorField}><span>{labels[key]}</span><div><input type="color" value={values[key]} aria-label={`Pick ${labels[key]} color`} onChange={(event) => { setValues((current) => ({ ...current, [key]: event.target.value.toUpperCase() })); setPreset(''); }} /><input key={values[key]} type="text" defaultValue={values[key]} aria-label={labels[key]} maxLength={7} onBlur={(event) => updateHex(key, event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} /></div></label>)}</div>

      <fieldset className={styles.navSettings}><legend>Navigation magnets</legend><p>Choose which magnets appear in the top navigation bar.</p><div className={styles.alwaysOn}><span>Menu magnet</span><small>Always on</small></div><div className={styles.alwaysOn}><span>Home magnet</span><small>Always on</small></div><div className={styles.alwaysOn}><span>Customizer magnet</span><small>Always on</small></div>{navLabels.map(([key, label]) => <label key={key}><input type="checkbox" checked={navSettings[key]} onChange={(event) => setNavSettings((current) => ({ ...current, [key]: event.target.checked }))} /><span>{label}</span></label>)}</fieldset>

      <section className={styles.tilt} aria-labelledby="tilt-title"><div><h3 id="tilt-title">Device tilt access</h3><p>Let magnets respond to how you hold your phone.</p></div><button type="button" role="switch" aria-checked="true" onClick={requestTilt}>On</button><small role="status">{tiltStatus}</small></section>

      <footer className={styles.footer}><button type="button" onClick={reset}>Reset to default</button><button type="button" className={styles.delete} onClick={deleteLocalData}>Delete localStorage</button></footer>
    </section>
  );
}
