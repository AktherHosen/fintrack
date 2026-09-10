import * as React from 'react';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  EditorState,
  LexicalEditor,
} from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import {
  ListNode,
  ListItemNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Undo,
  Redo,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface ToolbarProps {
  editor: LexicalEditor;
}

function Toolbar({ editor }: ToolbarProps) {
  const [isBold, setIsBold] = React.useState(false);
  const [isItalic, setIsItalic] = React.useState(false);
  const [isUnderline, setIsUnderline] = React.useState(false);
  const [isStrikethrough, setIsStrikethrough] = React.useState(false);
  const [isCode, setIsCode] = React.useState(false);

  const updateToolbar = React.useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));
    }
  }, []);

  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  return (
    <div className="flex items-center gap-0.5 p-1 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 rounded-t-lg flex-wrap">
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        className={cn(
          'p-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors',
          isBold && 'bg-zinc-200 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-bold'
        )}
        title="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        className={cn(
          'p-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors',
          isItalic && 'bg-zinc-200 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-bold'
        )}
        title="Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        className={cn(
          'p-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors',
          isUnderline &&
            'bg-zinc-200 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-bold'
        )}
        title="Underline"
      >
        <Underline className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
        className={cn(
          'p-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors',
          isStrikethrough &&
            'bg-zinc-200 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-bold'
        )}
        title="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
        className={cn(
          'p-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors',
          isCode && 'bg-zinc-200 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-bold'
        )}
        title="Inline Code"
      >
        <Code className="h-3.5 w-3.5" />
      </button>

      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

      <button
        type="button"
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
        className="p-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
        title="Bullet List"
      >
        <List className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
        className="p-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
        title="Numbered List"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </button>

      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

      <button
        type="button"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        className="p-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
        title="Undo"
      >
        <Undo className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        className="p-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
        title="Redo"
      >
        <Redo className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  return <Toolbar editor={editor} />;
}

function SyncInitialTextPlugin({ initialText }: { initialText?: string }) {
  const [editor] = useLexicalComposerContext();
  const hasInitializedRef = React.useRef(false);

  React.useEffect(() => {
    if (!hasInitializedRef.current && initialText) {
      hasInitializedRef.current = true;
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const lines = initialText.split('\n');
        lines.forEach((line) => {
          const p = $createParagraphNode();
          if (line) {
            p.append($createTextNode(line));
          }
          root.append(p);
        });
      });
    }
  }, [editor, initialText]);

  return null;
}

export interface RichTextEditorProps {
  value?: string;
  onChange?: (text: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Type here...',
  className,
  minHeight = '90px',
}: RichTextEditorProps) {
  const initialConfig = {
    namespace: 'FinTrackRichText',
    theme: {
      paragraph: 'mb-1 text-xs leading-relaxed',
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
        code: 'font-mono bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded text-[11px]',
      },
      list: {
        ul: 'list-disc ml-4 space-y-0.5 text-xs',
        ol: 'list-decimal ml-4 space-y-0.5 text-xs',
        listitem: 'text-xs',
      },
    },
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
    onError: (error: Error) => {
      console.error('Lexical Error:', error);
    },
  };

  const handleEditorChange = (editorState: EditorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const text = root.getTextContent();
      onChange?.(text);
    });
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xs overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all',
        className
      )}
    >
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <SyncInitialTextPlugin initialText={value} />
        <div className="relative p-2.5">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="outline-none text-xs text-zinc-900 dark:text-zinc-100 leading-relaxed overflow-y-auto"
                style={{ minHeight }}
              />
            }
            placeholder={
              <div className="absolute top-2.5 left-2.5 text-xs text-zinc-400 dark:text-zinc-500 pointer-events-none select-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <OnChangePlugin onChange={handleEditorChange} />
          <ListPlugin />
        </div>
      </LexicalComposer>
    </div>
  );
}
