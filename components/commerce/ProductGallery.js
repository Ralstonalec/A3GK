import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import Viewer360, { hasSpinMedia } from '@/components/3d/Viewer360';
import styles from '@/styles/pages.module.css';

/** A 360° tab appears only when the product has real spin media (turntable photos or a GLB). */
export const hasInteractive3d = (product) => hasSpinMedia({ frames: product.viewer360?.frames, model: product.model });

export default function ProductGallery({ product }) {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState('photos'); // photos | 3d
  const image = product.images[index] || product.images[0];
  const show3d = hasInteractive3d(product);

  return (
    <div className={styles.gallery}>
      {show3d && (
        <div className={styles.modeSwitch} role="group" aria-label="Gallery view">
          <button type="button" aria-pressed={mode === 'photos'} onClick={() => setMode('photos')}>Photos</button>
          <button type="button" aria-pressed={mode === '3d'} onClick={() => setMode('3d')}>360° view</button>
        </div>
      )}

      <div className={styles.galleryStage}>
        {mode === '3d' && show3d ? (
          <Viewer360 frames={product.viewer360?.frames} model={product.model} title={product.title} fallbackImage={image} />
        ) : (
          image && (
            <Image
              key={image.url}
              src={image.url}
              alt={image.altText || product.title}
              width={image.width}
              height={image.height}
              priority
              sizes="(min-width: 990px) 52vw, 100vw"
              className={styles.galleryImage}
            />
          )
        )}
      </div>

      {product.images.length > 1 && mode === 'photos' && (
        <ul role="list" className={styles.thumbs}>
          {product.images.map((img, i) => (
            <li key={img.url}>
              <button type="button" className={cn(styles.thumb, i === index && styles.thumbActive)} onClick={() => setIndex(i)} aria-label={`Show image ${i + 1} of ${product.images.length}`} aria-pressed={i === index}>
                <Image src={img.url} alt="" width={120} height={120} sizes="80px" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
