import {
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router';

import { annotationDescriptions } from '../../domain/observationInference';
import type {
  ObservationAnalysis,
  ObservationAnnotation,
  ObservationEvidence,
} from '../../domain/observationInference';
import styles from './AnnotatedObservationEditor.module.css';

type AnnotatedObservationEditorProps = {
  id: string;
  labelledBy: string;
  value: string;
  analysis: ObservationAnalysis;
  onChange: (value: string) => void;
  placeholder?: ReactNode;
};

type HighlightName =
  | 'observation-formula'
  | 'observation-feeling'
  | 'observation-need'
  | 'observation-faux-feeling'
  | 'observation-guidance'
  | 'observation-cue'
  | 'observation-active';

const HIGHLIGHT_NAMES: HighlightName[] = [
  'observation-formula',
  'observation-feeling',
  'observation-need',
  'observation-faux-feeling',
  'observation-guidance',
  'observation-cue',
  'observation-active',
];

function routeForEvidence(evidence: ObservationEvidence) {
  if (evidence.kind !== 'entity') return null;
  if (evidence.entityType === 'feeling') return `/feelings/${evidence.slug}`;
  if (evidence.entityType === 'need') return `/needs/${evidence.slug}`;
  return `/faux-feelings/${evidence.slug}`;
}

function highlightNames(annotation: ObservationAnnotation): HighlightName[] {
  const names = new Set<HighlightName>();
  annotation.evidence.forEach((evidence) => {
    if (evidence.kind === 'formula') names.add('observation-formula');
    else if (evidence.kind === 'guidance') names.add('observation-guidance');
    else if (evidence.kind === 'cue' || evidence.kind === 'eventFamily') names.add('observation-cue');
    else if (evidence.kind === 'surface') return;
    else if (evidence.entityType === 'feeling') names.add('observation-feeling');
    else if (evidence.entityType === 'need') names.add('observation-need');
    else names.add('observation-faux-feeling');
  });
  return [...names];
}

function textNodes(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    nodes.push(node as Text);
    node = walker.nextNode();
  }
  return nodes;
}

function pointAtOffset(root: HTMLElement, rawOffset: number) {
  const nodes = textNodes(root);
  const maximum = root.textContent?.length ?? 0;
  const offset = Math.max(0, Math.min(rawOffset, maximum));
  let consumed = 0;
  for (const node of nodes) {
    const next = consumed + node.data.length;
    if (offset <= next) return { node, offset: offset - consumed };
    consumed = next;
  }
  const last = nodes.at(-1);
  if (last) return { node: last, offset: last.data.length };
  const empty = document.createTextNode('');
  root.append(empty);
  return { node: empty, offset: 0 };
}

function rangeForOffsets(root: HTMLElement, start: number, end: number) {
  const startPoint = pointAtOffset(root, start);
  const endPoint = pointAtOffset(root, end);
  const range = document.createRange();
  range.setStart(startPoint.node, startPoint.offset);
  range.setEnd(endPoint.node, endPoint.offset);
  return range;
}

function selectionOffset(root: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.focusNode || !root.contains(selection.focusNode)) return null;
  const range = document.createRange();
  range.selectNodeContents(root);
  try {
    range.setEnd(selection.focusNode, selection.focusOffset);
  } catch {
    return null;
  }
  return range.toString().length;
}

function restoreSelection(root: HTMLElement, offset: number) {
  const point = pointAtOffset(root, offset);
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.setStart(point.node, point.offset);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function plainText(root: HTMLElement) {
  return (root.textContent ?? '').replace(/\r\n?/g, '\n');
}

function insertPlainText(root: HTMLElement, text: string) {
  root.focus();
  if (document.execCommand('insertText', false, text)) return;
  const selection = window.getSelection();
  if (!selection) return;
  let range: Range;
  if (selection.rangeCount && selection.anchorNode && root.contains(selection.anchorNode)) {
    range = selection.getRangeAt(0);
  } else {
    range = document.createRange();
    range.selectNodeContents(root);
    range.collapse(false);
  }
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function caretRangeFromPoint(x: number, y: number) {
  const documentWithCaret = document as Document & {
    caretPositionFromPoint?: (clientX: number, clientY: number) => CaretPosition | null;
    caretRangeFromPoint?: (clientX: number, clientY: number) => Range | null;
  };
  const position = documentWithCaret.caretPositionFromPoint?.(x, y);
  if (position) {
    const range = document.createRange();
    range.setStart(position.offsetNode, position.offset);
    range.collapse(true);
    return range;
  }
  return documentWithCaret.caretRangeFromPoint?.(x, y) ?? null;
}

function annotationAtOffset(annotations: ObservationAnnotation[], offset: number) {
  const priority = (annotation: ObservationAnnotation) => {
    if (annotation.evidence.some((evidence) => evidence.kind === 'entity')) return 0;
    if (annotation.evidence.some((evidence) => evidence.kind === 'formula')) return 1;
    if (annotation.evidence.some((evidence) => evidence.kind === 'guidance')) return 2;
    return 3;
  };
  return annotations
    .filter((annotation) => (
      offset >= annotation.start
      && offset < annotation.end
      && annotation.evidence.some((evidence) => evidence.kind !== 'surface')
    ))
    .sort((left, right) => priority(left) - priority(right) || (left.end - left.start) - (right.end - right.start))[0]
    ?? null;
}

function annotationAtCaretBoundary(annotations: ObservationAnnotation[], offset: number) {
  const exact = annotationAtOffset(annotations, offset);
  if (exact || offset <= 0) return exact;
  return annotationAtOffset(annotations, offset - 1);
}

export function AnnotatedObservationEditor({
  id,
  labelledBy,
  value,
  analysis,
  onChange,
  placeholder,
}: AnnotatedObservationEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const composingRef = useRef(false);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const activeAnnotation = analysis.annotations.find((annotation) => annotation.id === activeAnnotationId) ?? null;
  const inspectableAnnotations = analysis.annotations
    .map((annotation) => ({ annotation, descriptions: annotationDescriptions(annotation) }))
    .filter((entry) => entry.descriptions.length > 0);
  const ledgerId = `${id}-annotation-ledger`;

  const emitText = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const next = plainText(editor);
    if (next !== value) onChange(next);
  };

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor || plainText(editor) === value) return;
    const focused = document.activeElement === editor;
    const offset = focused ? selectionOffset(editor) : null;
    editor.textContent = value;
    if (focused && offset !== null) restoreSelection(editor, Math.min(offset, value.length));
  }, [value]);

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor || typeof CSS === 'undefined' || !CSS.highlights || typeof Highlight === 'undefined') return undefined;
    const buckets = new Map<HighlightName, Range[]>();
    HIGHLIGHT_NAMES.forEach((name) => buckets.set(name, []));
    analysis.annotations.forEach((annotation) => {
      const range = rangeForOffsets(editor, annotation.start, annotation.end);
      highlightNames(annotation).forEach((name) => buckets.get(name)?.push(range));
      if (annotation.id === activeAnnotationId) buckets.get('observation-active')?.push(range);
    });
    HIGHLIGHT_NAMES.forEach((name) => {
      const ranges = buckets.get(name) ?? [];
      if (ranges.length) CSS.highlights.set(name, new Highlight(...ranges));
      else CSS.highlights.delete(name);
    });
    return () => HIGHLIGHT_NAMES.forEach((name) => CSS.highlights.delete(name));
  }, [activeAnnotationId, analysis]);

  const inspectCaret = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const offset = selectionOffset(editor);
    setActiveAnnotationId(offset === null ? null : annotationAtCaretBoundary(analysis.annotations, offset)?.id ?? null);
  };

  const normalizeAndEmit = () => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.querySelector('*')) {
      const offset = selectionOffset(editor) ?? plainText(editor).length;
      const next = editor.innerText.replace(/\r\n?/g, '\n');
      editor.textContent = next;
      restoreSelection(editor, Math.min(offset, next.length));
    }
    emitText();
  };

  const handleInput = (_event: FormEvent<HTMLDivElement>) => {
    if (composingRef.current) return;
    normalizeAndEmit();
  };

  const handleBeforeInput = (event: FormEvent<HTMLDivElement>) => {
    const nativeEvent = event.nativeEvent as InputEvent;
    if (nativeEvent.isComposing || composingRef.current) return;
    if (nativeEvent.inputType === 'insertParagraph' || nativeEvent.inputType === 'insertLineBreak') {
      event.preventDefault();
      const editor = editorRef.current;
      if (!editor) return;
      insertPlainText(editor, '\n');
      emitText();
    } else if (nativeEvent.inputType.startsWith('format')) {
      event.preventDefault();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const editor = editorRef.current;
    if (!editor) return;
    insertPlainText(editor, event.clipboardData.getData('text/plain'));
    emitText();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    const text = event.dataTransfer.getData('text/plain');
    if (!text) return;
    event.preventDefault();
    const editor = editorRef.current;
    if (!editor) return;
    const range = caretRangeFromPoint(event.clientX, event.clientY);
    if (range && editor.contains(range.startContainer)) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    insertPlainText(editor, text);
    emitText();
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') inspectCaret();
  };

  return (
    <div className={styles.shell} data-observation-editor="single-surface">
      {inspectableAnnotations.length ? (
        <div className={styles.annotationTools}>
          <button
            type="button"
            className={styles.ledgerToggle}
            aria-expanded={ledgerOpen}
            aria-controls={ledgerId}
            onClick={() => setLedgerOpen((open) => !open)}
          >
            <span>Notes</span>
            <span className={styles.ledgerCount}>{inspectableAnnotations.length}</span>
            <span aria-hidden="true">{ledgerOpen ? '▴' : '▾'}</span>
          </button>
          {ledgerOpen ? (
            <aside id={ledgerId} className={styles.annotationLedger} aria-label="Observation text notes">
              <div className={styles.ledgerHeader}>
                <div>
                  <strong>Text notes</strong>
                  <span>Explanations for the marked text</span>
                </div>
                <button type="button" onClick={() => setLedgerOpen(false)} aria-label="Close text notes">×</button>
              </div>
              <div className={styles.ledgerEntries}>
                {inspectableAnnotations.map(({ annotation, descriptions }) => (
                  <section key={annotation.id} className={styles.ledgerEntry}>
                    <button type="button" className={styles.ledgerPhrase} onClick={() => setActiveAnnotationId(annotation.id)}>
                      “{annotation.text}”
                    </button>
                    <div>
                      {descriptions.map(({ evidence, description }, index) => {
                        const route = routeForEvidence(evidence);
                        return (
                          <p key={`${evidence.kind}-${index}`}>
                            <span>{description}</span>
                            {route && evidence.kind === 'entity' ? <Link to={route}>Open {evidence.title}</Link> : null}
                          </p>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </aside>
          ) : null}
        </div>
      ) : null}

      <div className={styles.root} data-empty={!value}>
        {placeholder && !value ? <div className={styles.placeholder} aria-hidden="true">{placeholder}</div> : null}
        <div
          ref={editorRef}
          id={id}
          className={styles.surface}
          role="textbox"
          aria-multiline="true"
          aria-labelledby={labelledBy}
          contentEditable
          data-annotation-count={analysis.annotations.length}
          suppressContentEditableWarning
          spellCheck
          autoCapitalize="sentences"
          autoCorrect="on"
          onBeforeInput={handleBeforeInput}
          onInput={handleInput}
          onCompositionStart={() => { composingRef.current = true; }}
          onCompositionEnd={() => {
            composingRef.current = false;
            normalizeAndEmit();
          }}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onPointerUp={() => window.requestAnimationFrame(inspectCaret)}
          onKeyUp={handleKeyUp}
        />
      </div>

      {activeAnnotation ? (
        <aside className={styles.annotationAction} aria-label={`About “${activeAnnotation.text}”`}>
          <div>
            {annotationDescriptions(activeAnnotation).map(({ evidence, description }, index) => {
              const route = routeForEvidence(evidence);
              return (
                <p key={`${evidence.kind}-${index}`}>
                  <span>{description}</span>
                  {route && evidence.kind === 'entity' ? <Link to={route}>Open {evidence.title}</Link> : null}
                </p>
              );
            })}
          </div>
          <button type="button" onClick={() => setActiveAnnotationId(null)} aria-label="Close text explanation">×</button>
        </aside>
      ) : null}
    </div>
  );
}
