import { Upload } from 'lucide-react';

export function ImagePlaceholder() {
  return (
    <div className="h-full w-full bg-gray-50 flex items-center justify-center">
      <Upload className="h-8 w-8 text-gray-400" />
    </div>
  );
}
