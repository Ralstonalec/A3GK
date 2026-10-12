import { useId, useRef, useState } from 'react';
import { ACCEPTED_LOGO_TYPES, LogoError, processLogoFile } from '@/lib/logo';
import { cn } from '@/lib/utils';
import { IconUpload } from '@/components/ui/Icons';
import styles from '@/styles/studio.module.css';

/**
 * Logo upload: click, keyboard (the label wraps a real file input) or drag-and-drop.
 * Files are validated, downscaled and re-encoded client-side (see lib/logo.js).
 */
export default function UploadDropzone({ onLogo, onRemove, hasLogo, fileName }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleFiles(files) {
    const file = files?.[0];
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const result = await processLogoFile(file);
      onLogo({ ...result, fileName: file.name });
    } catch (e) {
      setError(e instanceof LogoError ? e.message : 'Something went wrong reading that file.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className={styles.dropWrap}>
      <label
        htmlFor={inputId}
        className={cn(styles.dropzone, dragging && styles.dropzoneActive, hasLogo && styles.dropzoneFilled)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input ref={inputRef} id={inputId} type="file" accept={ACCEPTED_LOGO_TYPES.join(',')} className="visually-hidden" onChange={(e) => handleFiles(e.target.files)} />
        <IconUpload size={26} />
        <span className={styles.dropTitle}>{busy ? 'Processing…' : hasLogo ? 'Replace logo' : 'Upload your logo'}</span>
        <span className={styles.dropHint}>{hasLogo && fileName ? fileName : 'Drop an image or click · PNG, JPEG or WebP · max 6 MB'}</span>
      </label>
      {hasLogo && (
        <button type="button" className={styles.removeLogo} onClick={onRemove}>
          Remove logo
        </button>
      )}
      {error && <p className={styles.fieldError} role="alert">{error}</p>}
    </div>
  );
}
