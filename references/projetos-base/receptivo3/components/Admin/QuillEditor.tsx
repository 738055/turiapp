'use client';

// Este componente deve ser carregado APENAS via dynamic() com ssr: false.
// O import do CSS do Quill aqui garante que ele só seja processado no cliente,
// evitando falhas de build por imports CSS em contexto de servidor.
import 'react-quill/dist/quill.snow.css';
import ReactQuill from 'react-quill';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function QuillEditor({ value, onChange, className }: QuillEditorProps) {
  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      className={className}
    />
  );
}
