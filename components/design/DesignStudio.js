import '@fontsource/bebas-neue/400.css';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiUrl } from '@/lib/config';
import { track } from '@/lib/analytics';
import { hasConsent } from '@/lib/consent';
import { cloneDefaultConfig, FABRICS, FONTS, LOGO_PLACEMENT_IDS, PATTERNS, SIZES } from '@/lib/customizer-options';
import { LOGO_PLACEMENTS } from '@/lib/jersey-geometry';
import { imageFromDataUrl } from '@/lib/logo';
import { calculateCustomPrice } from '@/lib/pricing';
import { safeStorage } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { customizationSchema } from '@/lib/validation';
import AddToCartButton from '@/components/commerce/AddToCartButton';
import PriceCalculator from '@/components/commerce/PriceCalculator';
import Button from '@/components/ui/Button';
import Input, { Slider } from '@/components/ui/Input';
import QuantitySelector from '@/components/commerce/QuantitySelector';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { IconLink } from '@/components/ui/Icons';
import ColorPicker from './ColorPicker';
import PreviewPane from './PreviewPane';
import UploadDropzone from './UploadDropzone';
import styles from '@/styles/studio.module.css';

const PREFS_KEY = 'a3gk.studio.v1';

function Step({ number, title, children }) {
  return (
    <section className={styles.step} aria-labelledby={`step-${number}`}>
      <h2 id={`step-${number}`} className={styles.stepTitle}>
        <span className={styles.stepNumber} aria-hidden="true">{number}</span>
        {title}
      </h2>
      <div className={styles.stepBody}>{children}</div>
    </section>
  );
}

/**
 * Design Studio — configure, preview, price, save/share and buy a custom jersey.
 * @param {{ product: object|null }} props the custom-jersey product (variants carry Size + stock)
 */
export default function DesignStudio({ product }) {
  const router = useRouter();
  const toast = useToast();
  const [config, setConfig] = useState(cloneDefaultConfig);
  const [size, setSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [view, setView] = useState('front');
  const [logo, setLogo] = useState({ dataUrl: null, image: null, fileName: '' });
  const [savedId, setSavedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef(true);

  const patch = useCallback((changes) => {
    dirtyRef.current = true;
    setConfig((c) => ({ ...c, ...changes }));
  }, []);
  const patchLogo = useCallback((changes) => {
    dirtyRef.current = true;
    setConfig((c) => ({ ...c, logo: { ...c.logo, ...changes } }));
  }, []);

  /* Restore: ?design=<id> from the API, else last session (only with "preferences" consent). */
  const designParam = router.isReady ? router.query.design : null;
  useEffect(() => {
    if (!router.isReady) return undefined;
    let cancelled = false;
    async function load() {
      if (typeof designParam === 'string') {
        try {
          const res = await fetch(apiUrl(`/customizer?id=${encodeURIComponent(designParam)}`));
          if (!res.ok) throw new Error();
          const { design } = await res.json();
          if (cancelled) return;
          setConfig(design.config);
          setSize(design.size);
          setSavedId(design.id);
          dirtyRef.current = false;
          if (design.logoDataUrl) {
            const image = await imageFromDataUrl(design.logoDataUrl);
            if (!cancelled) setLogo({ dataUrl: design.logoDataUrl, image, fileName: 'Saved logo' });
          }
          toast.push({ tone: 'success', title: 'Design loaded' });
        } catch {
          if (!cancelled) toast.push({ tone: 'error', title: 'Could not load that design', description: 'The link may have expired.' });
        }
        return;
      }
      if (hasConsent('preferences')) {
        const stored = safeStorage.get(PREFS_KEY);
        const parsed = stored ? customizationSchema.safeParse(stored.config) : null;
        if (parsed?.success && !cancelled) {
          setConfig(parsed.data);
          if (SIZES.includes(stored.size)) setSize(stored.size);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, designParam]);

  /* Remember the last design (no logo bytes) when the visitor allowed "preferences". */
  useEffect(() => {
    if (hasConsent('preferences')) safeStorage.set(PREFS_KEY, { config, size });
  }, [config, size]);

  const price = useMemo(() => calculateCustomPrice({ basePriceCents: product?.priceRange.minCents ?? 7999, config, quantity }), [product, config, quantity]);
  const validation = useMemo(() => customizationSchema.safeParse(config), [config]);

  const variant = useMemo(() => product?.variants.find((v) => v.selectedOptions.some((o) => o.name === 'Size' && o.value === size)) || null, [product, size]);

  const logoPlacements = LOGO_PLACEMENTS;

  async function saveDesign() {
    const body = { config, size, ...(config.logo.enabled && logo.dataUrl ? { logoDataUrl: logo.dataUrl } : {}) };
    const res = await fetch(apiUrl('/customizer'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || 'Could not save your design.');
    setSavedId(json.id);
    dirtyRef.current = false;
    return json;
  }

  async function onSave() {
    setSaving(true);
    try {
      const { id, url } = await saveDesign();
      router.replace(url, undefined, { shallow: true });
      const full = `${window.location.origin}${url}`;
      try {
        await navigator.clipboard.writeText(full);
        toast.push({ tone: 'success', title: 'Design saved — link copied', description: full });
      } catch {
        toast.push({ tone: 'success', title: 'Design saved', description: full });
      }
      track('customizer_save', { design_id: id });
    } catch (e) {
      toast.push({ tone: 'error', title: 'Save failed', description: e.message });
    } finally {
      setSaving(false);
    }
  }

  /** Persist the design (with logo) so production has the artwork; the cart line only carries the config. */
  const beforeAdd = useCallback(async () => {
    track('customizer_add_to_cart', { pattern: config.pattern, has_logo: config.logo.enabled, quantity });
    if (!config.logo.enabled || !logo.dataUrl) return { designId: savedId || undefined };
    if (savedId && !dirtyRef.current) return { designId: savedId };
    try {
      const { id } = await saveDesign();
      return { designId: id };
    } catch {
      toast.push({ tone: 'info', title: 'Logo file not stored', description: 'We could not store your logo online. Your design is still in your cart.' });
      return { designId: undefined };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, logo.dataUrl, savedId, quantity]);

  const nameInvalid = !validation.success && validation.error.issues.find((i) => i.path[0] === 'playerName');
  const logoOnBack = config.logo.placement === 'upper-back';

  return (
    <div className={styles.studio}>
      <div className={styles.controls}>
        <Step number={1} title="Colours">
          <ColorPicker label="Body colour" value={config.baseColor} onChange={(v) => patch({ baseColor: v })} />
          <ColorPicker label="Accent colour" value={config.accentColor} onChange={(v) => patch({ accentColor: v })} hint="Used by the pattern." />
          <ColorPicker label="Trim colour" value={config.trimColor} onChange={(v) => patch({ trimColor: v })} hint="Collar, cuffs and hem." />
        </Step>

        <Step number={2} title="Pattern & fabric">
          <fieldset className={styles.optionFieldset}>
            <legend className={styles.optionLegend}>Pattern</legend>
            <div className={styles.optionGrid} role="radiogroup" aria-label="Pattern">
              {PATTERNS.map((p) => (
                <label key={p.id} className={cn(styles.option, config.pattern === p.id && styles.optionOn)}>
                  <input type="radio" name="pattern" value={p.id} checked={config.pattern === p.id} onChange={() => patch({ pattern: p.id })} className="visually-hidden" />
                  <span>{p.label}</span>
                  {p.priceCents > 0 && <small>+${(p.priceCents / 100).toFixed(0)}</small>}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className={styles.optionFieldset}>
            <legend className={styles.optionLegend}>Fabric</legend>
            <div className={styles.optionList} role="radiogroup" aria-label="Fabric">
              {FABRICS.map((f) => (
                <label key={f.id} className={cn(styles.optionRow, config.fabric === f.id && styles.optionOn)}>
                  <input type="radio" name="fabric" value={f.id} checked={config.fabric === f.id} onChange={() => patch({ fabric: f.id })} className="visually-hidden" />
                  <span>
                    <strong>{f.label}</strong>
                    {f.blurb && <small>{f.blurb}</small>}
                  </span>
                  <span className="tabular">{f.priceCents ? `+$${(f.priceCents / 100).toFixed(0)}` : 'Included'}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </Step>

        <Step number={3} title="Name & number">
          <div className={styles.twoCol}>
            <Input
              label="Player name"
              value={config.playerName}
              maxLength={14}
              autoComplete="off"
              spellCheck={false}
              hint={`${config.playerName.length}/14 · +$7 · printed on the back`}
              error={nameInvalid ? nameInvalid.message : undefined}
              onFocus={() => setView('back')}
              onChange={(e) => patch({ playerName: e.target.value.toUpperCase().replace(/[^A-Z0-9 .'-]/g, '') })}
            />
            <Input
              label="Squad number"
              inputMode="numeric"
              value={config.playerNumber}
              maxLength={2}
              autoComplete="off"
              hint="0–99 · +$5"
              onFocus={() => setView('back')}
              onChange={(e) => patch({ playerNumber: e.target.value.replace(/\D/g, '').slice(0, 2) })}
            />
          </div>
          <Select label="Lettering font" value={config.font} options={FONTS.map((f) => ({ value: f.id, label: f.label }))} onChange={(e) => patch({ font: e.target.value })} />
          <ColorPicker label="Lettering colour" value={config.textColor} onChange={(v) => patch({ textColor: v })} contrastWith={config.baseColor} />
        </Step>

        <Step number={4} title="Logo">
          <UploadDropzone
            hasLogo={config.logo.enabled}
            fileName={logo.fileName}
            onLogo={(result) => {
              setLogo({ dataUrl: result.dataUrl, image: result.image, fileName: result.fileName });
              patchLogo({ enabled: true });
              setView(logoOnBack ? 'back' : 'front');
              track('customizer_logo_upload');
            }}
            onRemove={() => {
              setLogo({ dataUrl: null, image: null, fileName: '' });
              patchLogo({ enabled: false });
            }}
          />
          {config.logo.enabled && (
            <div className={styles.logoControls}>
              <Select
                label="Placement"
                value={config.logo.placement}
                options={logoPlacements.filter((p) => LOGO_PLACEMENT_IDS.includes(p.id)).map((p) => ({ value: p.id, label: p.label }))}
                onChange={(e) => {
                  patchLogo({ placement: e.target.value });
                  setView(e.target.value === 'upper-back' ? 'back' : 'front');
                }}
              />
              <Slider label="Size" min={0.3} max={1.6} step={0.05} value={config.logo.scale} onChange={(v) => patchLogo({ scale: v })} format={(v) => `${Math.round(v * 100)}%`} />
              <Slider label="Move left / right" min={-60} max={60} step={1} value={config.logo.offsetX} onChange={(v) => patchLogo({ offsetX: v })} format={(v) => `${v > 0 ? '+' : ''}${v}`} />
              <Slider label="Move up / down" min={-60} max={60} step={1} value={config.logo.offsetY} onChange={(v) => patchLogo({ offsetY: v })} format={(v) => `${v > 0 ? '+' : ''}${v}`} />
              <p className={styles.fieldHint}>Custom logo +$12 per piece. Your logo is re-encoded in your browser; EXIF data is removed.</p>
            </div>
          )}
        </Step>

        <Step number={5} title="Size & quantity">
          <div className={styles.twoCol}>
            <Select
              label="Size"
              value={size}
              options={SIZES.map((s) => {
                const v = product?.variants.find((x) => x.selectedOptions.some((o) => o.value === s));
                return { value: s, label: v && !v.availableForSale ? `${s} — sold out` : s, disabled: v ? !v.availableForSale : false };
              })}
              onChange={(e) => setSize(e.target.value)}
            />
            <div className={styles.field}>
              <span className={styles.qtyLabel} id="studio-qty">Quantity</span>
              <QuantitySelector value={quantity} onChange={setQuantity} max={50} label="custom jerseys" />
            </div>
          </div>
        </Step>
      </div>

      <aside className={styles.side} aria-label="Preview and checkout">
        <div className={styles.sticky}>
          <PreviewPane config={config} view={view} onViewChange={setView} logoImage={logo.image} />
          <PriceCalculator result={price} />
          {product ? (
            <div className={styles.actions}>
              <AddToCartButton product={product} variant={variant} quantity={quantity} customization={validation.success ? validation.data : undefined} beforeAdd={beforeAdd} label={`Add to cart · ${price.totalCents ? `$${(price.totalCents / 100).toFixed(2)}` : ''}`} />
              <Button variant="secondary" fullWidth onClick={onSave} loading={saving} iconBefore={<IconLink size={18} />}>
                {savedId ? 'Update & copy link' : 'Save & share design'}
              </Button>
            </div>
          ) : (
            <p role="alert" className={styles.fieldError}>The custom jersey product is not available right now.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
