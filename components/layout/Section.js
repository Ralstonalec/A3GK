import { cn } from '@/lib/utils';

/**
 * Shopify-section wrapper.
 *
 * Renders the same hooks a Dawn section exposes (`shopify-section`,
 * `data-section-id`, `data-section-type`) plus the section's settings as
 * `data-setting-*` attributes, so each React section maps one-to-one onto a
 * Liquid file with a `{% schema %}` block — see ShopifyTheme/sections.
 */
export default function Section({ id, type, settings = {}, as: Tag = 'section', className, tight = false, labelledBy, children, ...rest }) {
  const dataSettings = Object.fromEntries(
    Object.entries(settings)
      .filter(([, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
      .map(([k, v]) => [`data-setting-${k.replace(/_/g, '-')}`, String(v)]),
  );
  return (
    <Tag
      id={id ? `shopify-section-${id}` : undefined}
      className={cn('shopify-section', 'section', tight && 'section--tight', className)}
      data-section-id={id}
      data-section-type={type}
      aria-labelledby={labelledBy}
      {...dataSettings}
      {...rest}
    >
      {children}
    </Tag>
  );
}
