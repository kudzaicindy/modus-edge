import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useCatalog } from "../catalog";
import { collections, partners } from "../data";
import { useTitle } from "../useTitle";

const pickIds = ["polo", "piped-polo", "handle-bottle", "tour-visor"];
const linePreview = collections.slice(0, 4);

const steps = [
  {
    title: "MOQ 20",
    text: "Bulk from twenty pieces, one style or mixed across the catalogue.",
  },
  {
    title: "Branding",
    text: "Print, embroidery, or a small mark on the blank face of each line.",
  },
  {
    title: "WhatsApp",
    text: "Build a list, send it, and the desk confirms totals and artwork.",
  },
];

export default function Home() {
  useTitle();
  const { products } = useCatalog();
  const picks = pickIds.map((id) => products.find((product) => product.id === id)).filter(Boolean);

  return (
    <>
      <section className="store-hero">
        <img className="store-hero-bg" src="/images/hero-golf-course.jpg" alt="" />
        <div className="store-hero-shade" aria-hidden="true" />
        <div className="store-hero-inner">
          <div className="store-hero-copy">
            <p className="store-brand-mark">MODUS-EDGE</p>
            <h1>Kit the club. Brand the pack.</h1>
            <p>
              Golf wear and corporate gifts, ready for your mark. Bulk from 20 pieces, send the list on WhatsApp.
            </p>
            <div className="store-hero-actions">
              <Link to="/shop" className="btn-shop">
                Shop the catalogue
              </Link>
              <Link to="/services" className="btn-ghost">
                Branding
              </Link>
            </div>
          </div>
          <div className="store-hero-product" aria-hidden="true">
            <img src="/images/hero-polo.png" alt="" />
          </div>
        </div>
      </section>

      <section className="store-steps" aria-label="How orders work">
        <div className="wrap store-steps-row">
          {steps.map((step) => (
            <article key={step.title} className="store-step">
              <h2>{step.title}</h2>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section store-shop">
        <div className="wrap">
          <div className="section-head store-shop-head">
            <div>
              <p className="eyebrow">Catalogue</p>
              <h2>Shop by line</h2>
              <p>Pick a line and open the stock list.</p>
            </div>
          </div>
          <div className="store-lines store-lines-preview">
            {linePreview.map((collection) => (
              <Link key={collection.title} to={collection.to} className="store-line">
                <div className="store-line-media">
                  <img src={collection.image} alt="" />
                </div>
                <div className="store-line-copy">
                  <h3>{collection.title}</h3>
                  <p>{collection.text}</p>
                </div>
              </Link>
            ))}
            <Link to="/shop" className="store-line store-line-more">
              <div className="store-line-media store-line-arrow">
                <span className="store-go-label">Go shopping</span>
                <span className="store-go-icon" aria-hidden="true">
                  <ArrowRight size={22} strokeWidth={2.25} />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="section store-picks">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">On the rail</p>
              <h2>From the catalogue</h2>
              <p>Polos, a tour visor, and a handle bottle, ready to brand.</p>
            </div>
            <Link to="/shop" className="btn-dark">
              See more
            </Link>
          </div>
          <div className="grid">
            {picks.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="section store-brand-wrap">
        <div className="wrap">
          <div className="store-brand">
            <div className="store-brand-copy">
              <p className="store-kicker">Your mark</p>
              <h2>We brand these items.</h2>
              <p>
                Print, embroidery, or a stamp on the blank face. Twenty pieces to start. Send artwork with the list and
                the desk confirms placement.
              </p>
              <Link to="/services" className="btn-shop">
                Ask about branding
              </Link>
            </div>
            <div className="store-brand-photo">
              <img src="/images/polo-piped-navy.png" alt="Navy piped polo ready for branding" />
            </div>
          </div>
        </div>
      </section>

      <section className="trusted" aria-label="Clubs and companies">
        <p>Trusted by these clubs</p>
        <div className="marquee">
          <div className="marquee-track">
            {[...partners, ...partners].map((name, nameIndex) => (
              <span key={`${name}-${nameIndex}`}>{name}</span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
