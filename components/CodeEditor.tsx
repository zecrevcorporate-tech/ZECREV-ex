import React, { useRef, useEffect } from 'react';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { html } from '@codemirror/lang-html';
import { defaultKeymap } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const CodeEditorComponent: React.FC<CodeEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        keymap.of(defaultKeymap),
        html(),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          "&": {
            height: "100%",
            backgroundColor: "rgb(15 23 42 / 0.9)", // slate-900 with 90% opacity
            color: "#d1d5db", // gray-300
          },
          ".cm-content": {
            caretColor: "#fff",
          },
          "&.cm-focused .cm-cursor": {
            borderLeftColor: "#fff",
          },
          "&.cm-focused .cm-selectionBackground, ::selection": {
            backgroundColor: "#27344b",
          },
          ".cm-gutters": {
            backgroundColor: "rgb(15 23 42 / 0.9)",
            color: "#6b7280", // gray-500
            border: "none",
          },
        }, {dark: true})
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [onChange]);

  useEffect(() => {
    if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={editorRef} className="w-full h-full overflow-hidden" />;
};

const CodeEditor = React.memo(CodeEditorComponent);
export default CodeEditor;
