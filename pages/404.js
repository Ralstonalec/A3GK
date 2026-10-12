import Seo from '@/components/layout/Seo';
import Button from '@/components/ui/Button';
import styles from '@/styles/pages.module.css';

export default function NotFound() {
  return (
    <>
      <Seo title="Page not found" noindex />
      <div className={`page-width ${styles.notFound}`}>
        <p className="eyebrow">Error 404</p>
        <h1 className="h-hero">Off the pitch.</h1>
        <p className="lead">That page doesn’t exist — it may have moved, or the link is out of date.</p>
        <div className="cluster">
          <Button href="/" size="lg">Back to home</Button>
          <Button href="/products" variant="secondary" size="lg">Shop gear</Button>
        </div>
      </div>
    </>
  );
}
