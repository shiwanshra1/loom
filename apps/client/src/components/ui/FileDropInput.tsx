import { useRef, useState, type DragEvent } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileDropInputProps {
  accept?: string;
  onFile: (file: File) => void;
  label?: string;
}

export function FileDropInput({ accept = '.csv', onFile, label = 'Drop a CSV file here, or click to browse' }: FileDropInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setFileName(file.name);
    onFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm transition-colors ${
        dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
      }`}
    >
      <UploadCloud size={24} className="text-slate-400" />
      <p className="text-slate-600">{fileName ?? label}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
