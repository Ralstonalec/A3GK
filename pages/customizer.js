import Seo from '@/components/layout/Seo';
import DesignStudio from '@/components/design/DesignStudio';
import { FEATURES } from '@/lib/features';
import { CUSTOM_PRODUCT_HANDLE } from '@/lib/customizer-options';
import { getProduct } from '@/lib/products';
import styles from '@/styles/studio.module.css';

// Custom kit is a work in progress: until NEXT_PUBLIC_FEATURE_CUSTOM_KIT is on this route does not exist (404).
export async function getStaticProps() {
  if (!FEATURES.customKit) return { notFound: true };
  const product = await getProduct(CUSTOM_PRODUCT_HANDLE);
  return { props: { product: product || null }, revalidate: 60 };
}

export default function Customizer({ product }) {
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
