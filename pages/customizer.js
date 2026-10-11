import Seo from '@/components/layout/Seo';
import DesignStudio from '@/components/design/DesignStudio';
import { CUSTOM_PRODUCT_HANDLE } from '@/lib/customizer-options';
import { getProduct } from '@/lib/products';
import styles from '@/styles/studio.module.css';

export async function getStaticProps() {
  const product = await getProduct(CUSTOM_PRODUCT_HANDLE);
  return { props: { product: product || null }, revalidate: 60 };
}

export default function Customizer({ product }) {
  return (
    <>
      <Seo title="Design Studio" description="Design a custom goalkeeper jersey with live preview: colours, patterns, fabric, name, number and logo — priced instantly." path="/customizer" />
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
