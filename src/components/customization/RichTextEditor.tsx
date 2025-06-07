import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Type,
  Palette
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  onSubmit,
  onCancel,
  placeholder = "Type your text here..."
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[120px] p-3 text-white',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const colors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
    '#ffc0cb', '#a52a2a', '#808080', '#000080', '#008000'
  ];

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-600 p-2 flex flex-wrap items-center gap-1 bg-gray-700">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r border-gray-600 pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('bold') 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-600'
            }`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('italic') 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-600'
            }`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('underline') 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-600'
            }`}
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-1 border-r border-gray-600 pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive({ textAlign: 'left' }) 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-600'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive({ textAlign: 'center' }) 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-600'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive({ textAlign: 'right' }) 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-600'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-1 border-r border-gray-600 pr-2 mr-2">
          <Type className="w-4 h-4 text-gray-400" />
          <select
            onChange={(e) => {
              const size = e.target.value;
              if (size) {
                editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
              }
            }}
            className="bg-gray-700 text-white text-xs border border-gray-600 rounded px-1 py-0.5"
          >
            <option value="">Size</option>
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="28px">28px</option>
            <option value="32px">32px</option>
            <option value="36px">36px</option>
            <option value="48px">48px</option>
            <option value="64px">64px</option>
            <option value="72px">72px</option>
          </select>
        </div>

        {/* Color Picker */}
        <div className="flex items-center gap-1">
          <Palette className="w-4 h-4 text-gray-400" />
          <div className="flex flex-wrap gap-0.5 max-w-[120px]">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => editor.chain().focus().setColor(color).run()}
                className="w-4 h-4 rounded border border-gray-500 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={`Set color to ${color}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="bg-gray-800 text-white min-h-[120px]">
        <EditorContent 
          editor={editor} 
          className="rich-text-editor"
        />
      </div>

      {/* Action Buttons */}
      <div className="border-t border-gray-600 p-3 flex items-center justify-between bg-gray-700">
        <p className="text-xs text-gray-400">
          Use the toolbar above to format your text
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Apply Text
          </button>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor; 