import { ButtonLink } from '../components/Button';

export default function NotFound() {
  return (
    <section className="section notfound">
      <div className="container">
        <p className="kicker">Page not found</p>
        <h1 className="display">This road doesn’t lead anywhere yet.</h1>
        <p className="lede">The page may have moved, or the link may be mistyped.</p>
        <div className="page-hero-actions">
          <ButtonLink to="/">Back to home</ButtonLink>
          <ButtonLink to="/faq" variant="ghost">
            Read the FAQ
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
