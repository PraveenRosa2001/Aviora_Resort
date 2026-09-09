import { useRef, useState } from 'react';
import {
  Upload,
  Loader2,
  X,
  Image as ImageIcon,
  Link2,
  AlertTriangle,
} from 'lucide-react';
import { useUploadMediaMutation } from '../../features/rooms/roomsApi';
import { mediaUrl } from '../../config/mediaUrl';

/* --------------------------------------------------------------------------
   One image: upload a file, or paste a path.

   Both are kept because they answer different needs. Uploading is what an
   administrator wants for a new photograph. Pasting a path is how the seeded
   /assets images are referenced, and how a photograph already used by another
   villa gets reused without a second copy on disk.

   The value handed back is always the root-relative path. mediaUrl() resolves
   it for display, because an uploaded file lives on the API origin while an
   /assets path is served by Vite.
   -------------------------------------------------------------------------- */

export default function ImageUploadField({
  value = '',
  onChange,
  folder = 'villas',
  /** 'hero' shows a large preview, 'slot' shows a compact row. */
  variant = 'hero',
  placeholder = '/assets/images/villas/canopy-villa-01.jpg',
  index,
  warn = false,
  disabled = false,
}) {
  const fileInput = useRef(null);
  const [uploadMedia, { isLoading: uploading }] = useUploadMediaMutation();
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const send = async (file) => {
    if (!file) return;
    setError('');

    try {
      const form = new FormData();
      form.append('file', file);

      const result = await uploadMedia({ formData: form, folder }).unwrap();
      onChange(result.url);
    } catch (err) {
      setError(err?.data?.message || 'The image could not be uploaded.');
    } finally {
      // Reset so choosing the same file twice still fires onChange.
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    send(e.dataTransfer.files?.[0]);
  };

  const hidden = (
    <input
      ref={fileInput}
      type="file"
      accept="image/jpeg,image/png,image/webp,image/avif"
      onChange={(e) => send(e.target.files?.[0])}
      className="hidden"
      disabled={disabled}
    />
  );

  const uploadButton = (compact) => (
    <button
      type="button"
      onClick={() => fileInput.current?.click()}
      disabled={uploading || disabled}
      title="Upload a photograph from this computer"
      className={[
        'shrink-0 rounded-lg bg-primary hover:bg-primary-container text-white',
        'font-bold uppercase tracking-wider transition-colors cursor-pointer',
        'flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed',
        compact ? 'w-9 h-9' : 'px-4 py-2.5 text-[11px]',
      ].join(' ')}
    >
      {uploading ? (
        <Loader2 size={compact ? 14 : 13} className="animate-spin" />
      ) : (
        <Upload size={compact ? 14 : 13} />
      )}
      {!compact && <span>Upload</span>}
    </button>
  );

  /* ---------------- compact row, for the six gallery slots ---------------- */
  if (variant === 'slot') {
    return (
      <div className="space-y-1">
        <div
          className="flex items-center gap-2.5"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {hidden}

          <span className="shrink-0 w-6 text-[11px] font-bold text-deep-wood/50 text-center font-mono">
            {index}
          </span>

          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading || disabled}
            title={value ? 'Replace this photograph' : 'Upload a photograph'}
            className={[
              'shrink-0 w-14 h-10 rounded-lg overflow-hidden border flex items-center justify-center',
              'shadow-xs transition-colors cursor-pointer relative group',
              dragOver
                ? 'border-primary border-2 bg-primary/5'
                : 'bg-surface-container-high border-outline-variant/40 hover:border-primary',
            ].join(' ')}
          >
            {value.trim() ? (
              <>
                <img
                  src={mediaUrl(value)}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.visibility = 'hidden';
                  }}
                  onLoad={(e) => {
                    e.currentTarget.style.visibility = 'visible';
                  }}
                />
                <span className="absolute inset-0 bg-deep-wood/0 group-hover:bg-deep-wood/60 flex items-center justify-center transition-colors">
                  <Upload
                    size={13}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </span>
              </>
            ) : uploading ? (
              <Loader2 size={14} className="animate-spin text-primary" />
            ) : (
              <Upload size={14} className="text-deep-wood/40" />
            )}
          </button>

          <input
            className={[
              'flex-1 px-4 py-2 text-xs bg-white border rounded-xl font-mono',
              'text-deep-wood font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none',
              'shadow-xs transition-all placeholder:text-deep-wood/35',
              warn
                ? 'border-amber-500 focus:border-amber-600'
                : 'border-outline-variant/40 focus:border-primary',
            ].join(' ')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
          />

          {value.trim() && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 rounded-lg text-deep-wood/40 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              title="Clear this photograph"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {error && (
          <p className="pl-[86px] text-[10px] text-red-600 font-semibold flex items-center gap-1">
            <AlertTriangle size={10} /> {error}
          </p>
        )}
      </div>
    );
  }

  /* ---------------- large panel, for the hero ---------------- */
  return (
    <div className="space-y-2">
      {hidden}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Link2
            size={13}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-deep-wood/35 pointer-events-none"
          />
          <input
            className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-outline-variant/40 rounded-xl text-deep-wood font-mono font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-xs transition-all placeholder:text-deep-wood/35"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
          />
        </div>
        {uploadButton(false)}
      </div>

      {/* Drop target doubles as the preview, so there is one obvious place to
          put a photograph rather than a separate dropzone and thumbnail. */}
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={uploading || disabled}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={[
          'relative w-full h-36 rounded-xl overflow-hidden border-2 border-dashed',
          'flex items-center justify-center transition-colors cursor-pointer group',
          dragOver
            ? 'border-primary bg-primary/5'
            : value.trim()
              ? 'border-primary/20 border-solid bg-surface-container-high'
              : 'border-outline-variant/50 bg-surface-container-high/40 hover:border-primary/50',
        ].join(' ')}
      >
        {value.trim() ? (
          <>
            <img
              src={mediaUrl(value)}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.visibility = 'hidden';
              }}
              onLoad={(e) => {
                e.currentTarget.style.visibility = 'visible';
              }}
            />
            <span className="absolute inset-0 bg-deep-wood/0 group-hover:bg-deep-wood/55 flex flex-col items-center justify-center gap-1 transition-colors">
              <Upload
                size={18}
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white opacity-0 group-hover:opacity-100 transition-opacity">
                Replace
              </span>
            </span>
          </>
        ) : uploading ? (
          <span className="flex flex-col items-center gap-2 text-primary">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Uploading</span>
          </span>
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-deep-wood/40">
            <ImageIcon size={22} />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Drop a photograph, or click to browse
            </span>
            <span className="text-[10px] font-medium">
              JPEG, PNG, WebP or AVIF · under 6 MB
            </span>
          </span>
        )}
      </button>

      {error && (
        <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1.5">
          <AlertTriangle size={12} /> {error}
        </p>
      )}
    </div>
  );
}
