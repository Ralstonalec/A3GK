import Seo from '@/components/layout/Seo';
import DesignStudio from '@/components/design/DesignStudio';
import Button from '@/components/ui/Button';
import { FEATURES } from '@/lib/features';
import { CUSTOM_PRODUCT_HANDLE } from '@/lib/customizer-options';
import { getProduct } from '@/lib/products';
import styles from '@/styles/studio.module.css';

export async function getStaticProps() {
  if (!FEATURES.customKit) return { props: { product: null } };
  const product = await getProduct(CUSTOM_PRODUCT_HANDLE);
  return { props: { product: product || null }, revalidate: 60 };
}

export default function Customizer({ product }) {
  // Custom kit is a work in progress: until NEXT_PUBLIC_FEATURE_CUSTOM_KIT is on, this page is a plain notice.
  if (!FEATURES.customKit) {
    return (
      <>
        <Seo title="Custom kit" path="/customizer" noindex />
        <div className={`page-width ${styles.page}`}>
          <header className={styles.header}>
            <p className="eyebrow">Custom kit</p>
            <h1>Custom kit is in development</h1>
            <p className="lead">Custom-designed kit can’t be ordered yet.</p>
            <Button href="/products">Shop the current range</Button>
          </header>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo title="Design Studio" description="Design a custom goalkeeper jersey with a live preview: colours, patterns, fabric, name, number and logo, priced instantly." path="/customizer" />
      <div className={`page-width ${styles.page}`}>
        <header className={styles.header}>
          <p className="eyebrow">Design Studio</p>
          <h1>Build your kit</h1>
          <p className="lead">Every change updates the preview and the price instantly. Save your design to share it with your team.</p>
        </header>
        <DesignStudio product={product} />
      </div>
    </>
  );
}
