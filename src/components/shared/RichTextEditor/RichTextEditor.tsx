import classNames from '@/utils/classNames'
import ToolButtonBold from './toolButtons/ToolButtonBold'
import ToolButtonItalic from './toolButtons/ToolButtonItalic'
import ToolButtonStrike from './toolButtons/ToolButtonStrike'
import ToolButtonCode from './toolButtons/ToolButtonCode'
import ToolButtonOrderedList from './toolButtons/ToolButtonOrderedList'
import ToolButtonCodeBlock from './toolButtons/ToolButtonCodeBlock'
import ToolButtonBlockquote from './toolButtons/ToolButtonBlockquote'
import ToolButtonHorizontalRule from './toolButtons/ToolButtonHorizontalRule'
import ToolButtonHeading from './toolButtons/ToolButtonHeading'
import ToolButtonParagraph from './toolButtons/ToolButtonParagraph'
import ToolButtonUndo from './toolButtons/ToolButtonUndo'
import ToolButtonRedo from './toolButtons/ToolButtonRedo'
import ToolButtonBulletList from './toolButtons/ToolButtonBulletList'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import {
    TbAlignCenter,
    TbAlignLeft,
    TbAlignRight,
    TbHighlight,
    TbLink,
    TbPhoto,
    TbTable,
    TbTableMinus,
    TbUnderline,
} from 'react-icons/tb'
import ToolButton from './toolButtons/ToolButton'
import type { Editor, EditorContentProps, JSONContent } from '@tiptap/react'
import { useEffect } from 'react'
import type { ReactNode, JSX, Ref } from 'react'
import type { BaseToolButtonProps, HeadingLevel } from './toolButtons/types'

export type RichTextEditorRef = HTMLDivElement

type RichTextEditorProps = {
    content?: string
    invalid?: boolean
    customToolBar?: (
        editor: Editor,
        components: {
            ToolButtonBold: ({ editor }: BaseToolButtonProps) => JSX.Element
            ToolButtonItalic: ({ editor }: BaseToolButtonProps) => JSX.Element
            ToolButtonStrike: ({ editor }: BaseToolButtonProps) => JSX.Element
            ToolButtonCode: ({ editor }: BaseToolButtonProps) => JSX.Element
            ToolButtonBlockquote: ({
                editor,
            }: BaseToolButtonProps) => JSX.Element
            ToolButtonHeading: ({
                editor,
            }: BaseToolButtonProps & {
                headingLevel?: HeadingLevel[]
            }) => JSX.Element
            ToolButtonBulletList: ({
                editor,
            }: BaseToolButtonProps) => JSX.Element
            ToolButtonOrderedList: ({
                editor,
            }: BaseToolButtonProps) => JSX.Element
            ToolButtonCodeBlock: ({
                editor,
            }: BaseToolButtonProps) => JSX.Element
            ToolButtonHorizontalRule: ({
                editor,
            }: BaseToolButtonProps) => JSX.Element
            ToolButtonParagraph: ({
                editor,
            }: BaseToolButtonProps) => JSX.Element
            ToolButtonUndo: ({ editor }: BaseToolButtonProps) => JSX.Element
            ToolButtonRedo: ({ editor }: BaseToolButtonProps) => JSX.Element
        },
    ) => ReactNode
    onChange?: (content: {
        text: string
        html: string
        json: JSONContent
    }) => void
    editorContentClass?: string
    customEditor?: Editor | null
    ref?: Ref<RichTextEditorRef>
} & Omit<EditorContentProps, 'editor' | 'ref' | 'onChange'>

const RichTextEditor = (props: RichTextEditorProps) => {
    const {
        content = '',
        customToolBar,
        invalid,
        onChange,
        editorContentClass,
        customEditor,
        ref,
        ...rest
    } = props

    const editor = customEditor
        ? customEditor
        : useEditor({
              extensions: [
                  StarterKit.configure({
                      bulletList: {
                          keepMarks: true,
                      },
                      orderedList: {
                          keepMarks: true,
                      },
                  }),
                  Highlight,
                  Image.configure({ allowBase64: false }),
                  Link.configure({
                      openOnClick: false,
                      autolink: true,
                      defaultProtocol: 'https',
                  }),
                  Table.configure({ resizable: true }),
                  TableRow,
                  TableHeader,
                  TableCell,
                  TextAlign.configure({ types: ['heading', 'paragraph'] }),
                  Underline,
              ],
              editorProps: {
                  attributes: {
                      class: 'm-2 focus:outline-hidden text-right h-40',
                      dir: 'rtl',
                  },
              },
              content,
              onUpdate({ editor }) {
                  onChange?.({
                      text: editor.getText(),
                      html: editor.getHTML(),
                      json: editor.getJSON(),
                  })
              },
          })

    useEffect(() => {
        if (!editor || editor.isDestroyed || editor.getHTML() === content) {
            return
        }

        // TipTap reads `content` only while creating the editor. Admin forms
        // load their values asynchronously, so synchronize later resets
        // without emitting an update that would mark the form as edited.
        editor.commands.setContent(content, false)
    }, [content, editor])

    if (!editor) return null

    return (
        <div
            className={classNames(
                'rich-text-editor rounded-xl ring-1 ring-gray-200 dark:ring-gray-600 border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 pt-3',
                editor.isFocused && 'ring-primary border-primary',
                invalid && 'bg-error-subtle',
                editor.isFocused &&
                    invalid &&
                    'bg-error-subtle ring-error border-error',
            )}
        >
            <div className="flex flex-wrap gap-x-1 gap-y-2 px-2">
                {customToolBar ? (
                    customToolBar(editor, {
                        ToolButtonBold,
                        ToolButtonItalic,
                        ToolButtonStrike,
                        ToolButtonCode,
                        ToolButtonBlockquote,
                        ToolButtonHeading,
                        ToolButtonBulletList,
                        ToolButtonOrderedList,
                        ToolButtonCodeBlock,
                        ToolButtonHorizontalRule,
                        ToolButtonParagraph,
                        ToolButtonUndo,
                        ToolButtonRedo,
                    })
                ) : (
                    <>
                        <ToolButtonBold editor={editor} />
                        <ToolButtonItalic editor={editor} />
                        <ToolButtonStrike editor={editor} />
                        <ToolButtonCode editor={editor} />
                        <ToolButtonBlockquote editor={editor} />
                        <ToolButtonHeading editor={editor} />
                        <ToolButtonBulletList editor={editor} />
                        <ToolButtonOrderedList editor={editor} />
                        <ToolButtonCodeBlock editor={editor} />
                        <ToolButtonHorizontalRule editor={editor} />
                        <ToolButton
                            title="Underline"
                            active={editor.isActive('underline')}
                            onClick={() =>
                                editor.chain().focus().toggleUnderline().run()
                            }
                        >
                            <TbUnderline />
                        </ToolButton>
                        <ToolButton
                            title="Highlight"
                            active={editor.isActive('highlight')}
                            onClick={() =>
                                editor.chain().focus().toggleHighlight().run()
                            }
                        >
                            <TbHighlight />
                        </ToolButton>
                        <ToolButton
                            title="Add or edit link"
                            active={editor.isActive('link')}
                            onClick={() => {
                                const previous = editor.getAttributes('link')
                                    .href as string | undefined
                                const href = window.prompt(
                                    'Link URL',
                                    previous ?? 'https://',
                                )
                                if (href === null) return
                                if (href.trim() === '') {
                                    editor
                                        .chain()
                                        .focus()
                                        .extendMarkRange('link')
                                        .unsetLink()
                                        .run()
                                    return
                                }
                                editor
                                    .chain()
                                    .focus()
                                    .extendMarkRange('link')
                                    .setLink({ href: href.trim() })
                                    .run()
                            }}
                        >
                            <TbLink />
                        </ToolButton>
                        <ToolButton
                            title="Insert image from URL"
                            onClick={() => {
                                const src = window
                                    .prompt('Image URL', 'https://')
                                    ?.trim()
                                if (src)
                                    editor
                                        .chain()
                                        .focus()
                                        .setImage({ src })
                                        .run()
                            }}
                        >
                            <TbPhoto />
                        </ToolButton>
                        <ToolButton
                            title="Insert table"
                            onClick={() =>
                                editor
                                    .chain()
                                    .focus()
                                    .insertTable({
                                        rows: 3,
                                        cols: 3,
                                        withHeaderRow: true,
                                    })
                                    .run()
                            }
                        >
                            <TbTable />
                        </ToolButton>
                        <ToolButton
                            title="Delete table"
                            disabled={!editor.can().deleteTable()}
                            onClick={() =>
                                editor.chain().focus().deleteTable().run()
                            }
                        >
                            <TbTableMinus />
                        </ToolButton>
                        {(['left', 'center', 'right'] as const).map(
                            (alignment) => {
                                const Icon =
                                    alignment === 'left'
                                        ? TbAlignLeft
                                        : alignment === 'center'
                                          ? TbAlignCenter
                                          : TbAlignRight
                                return (
                                    <ToolButton
                                        key={alignment}
                                        title={`Align ${alignment}`}
                                        active={editor.isActive({
                                            textAlign: alignment,
                                        })}
                                        onClick={() =>
                                            editor
                                                .chain()
                                                .focus()
                                                .setTextAlign(alignment)
                                                .run()
                                        }
                                    >
                                        <Icon />
                                    </ToolButton>
                                )
                            },
                        )}
                        {editor.isActive('table') && (
                            <>
                                <ToolButton
                                    title="Add row"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .addRowAfter()
                                            .run()
                                    }
                                >
                                    <span className="text-xs font-semibold">
                                        + Row
                                    </span>
                                </ToolButton>
                                <ToolButton
                                    title="Delete row"
                                    onClick={() =>
                                        editor.chain().focus().deleteRow().run()
                                    }
                                >
                                    <span className="text-xs font-semibold">
                                        − Row
                                    </span>
                                </ToolButton>
                                <ToolButton
                                    title="Add column"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .addColumnAfter()
                                            .run()
                                    }
                                >
                                    <span className="text-xs font-semibold">
                                        + Col
                                    </span>
                                </ToolButton>
                                <ToolButton
                                    title="Delete column"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .deleteColumn()
                                            .run()
                                    }
                                >
                                    <span className="text-xs font-semibold">
                                        − Col
                                    </span>
                                </ToolButton>
                            </>
                        )}
                    </>
                )}
            </div>

            <EditorContent
                ref={ref}
                className={classNames(
                    'max-h-[600px] overflow-auto px-2 prose prose-p:text-sm dark:prose-p:text-gray-400 prose-img:max-w-full prose-table:border-collapse prose-th:border prose-th:p-2 prose-td:border prose-td:p-2 max-w-full text-right',
                    editorContentClass,
                )}
                editor={editor}
                {...rest}
            />
        </div>
    )
}

export default RichTextEditor
