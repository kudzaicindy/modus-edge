import { Link } from "react-router-dom";
import { brand } from "../data";
import { whatsappHref } from "../order";
import { useTitle } from "../useTitle";

const methods = [
  {
    title: "Print",
    text: "A clean logo print on polos, caps, bottles, and bags. Send the artwork and the size run — the desk confirms placement before the order is final.",
    image: "/images/polo-lime.png",
    alt: "Lime polo ready for a printed mark",
  },
  {
    title: "Embroidery",
    text: "Raised stitch on caps, jackets, and towels. Built for a club crest or a company mark that needs to hold up on the course.",
    image: "/images/polo-piped-navy.png",
    alt: "Navy piped polo ready for embroidery",
  },
  {
    title: "Gift sets",
    text: "Notebooks, pens, power banks, and bottles packed as prizes or guest gifts. Same catalogue pieces, one branded kit.",
    image: "/images/gift-bamboo-peach-box.png",
    alt: "Bamboo desk gift set in a black box",
  },
];

const surfaces = [
  { label: "Polos", image: "/images/polo-tm-tipped-white.png" },
  { label: "Caps", image: "/images/cap-titleist-fj-white.png" },
  { label: "Bottles", image: "/images/bottle-handle-orange.png" },
  { label: "Bags", image: "/images/bag-pack-slim.png" },
  { label: "Desk gifts", image: "/images/power-notebook.png" },
];

const steps = [
  { n: "01", title: "Pick the pieces", text: "From twenty items up — one style or mixed across the catalogue." },
  { n: "02", title: "Send the artwork", text: "Logo file with the WhatsApp list. We confirm size and placement." },
  { n: "03", title: "Desk confirms", text: "Totals, mark, and lead time before anything is treated as final." },
];

export default function Services() {
  useTitle("Branding");
  const wa = whatsappHref(`Hello ${brand.name}, I would like to ask about branding.`);

  return (
    <div className="brand-page">
      <section className="brand-hero">
        <div className="brand-hero-wash" aria-hidden="true" />
        <div className="brand-hero-grid" aria-hidden="true" />
        <div className="wrap brand-hero-inner">
          <div className="brand-hero-copy">
            <p className="brand-hero-mark">MODUS-EDGE</p>
            <h1>Press your mark.</h1>
            <p>Print, embroidery, or a stamp on blank faces. From twenty pieces — artwork with the list.</p>
            <div className="brand-hero-actions">
              <a className="btn-lime" href={wa} target="_blank" rel="noreferrer">
                Ask on WhatsApp
              </a>
              <Link to="/shop" className="btn-ghost-ink">
                Browse catalogue
              </Link>
            </div>
          </div>
        </div>
        <div className="brand-hero-press" aria-hidden="true">
          <div className="brand-hero-press-track">
            <img src="/images/polo-lime.png" alt="" />
            <img src="/images/cap-titleist-fj-white.png" alt="" />
            <img src="/images/bottle-handle-black.png" alt="" />
            <img src="/images/polo-piped-navy.png" alt="" />
            <img src="/images/power-notebook.png" alt="" />
            <img src="/images/bag-tote-navy.png" alt="" />
          </div>
          <p className="brand-hero-press-label">Blank faces · ready for a mark</p>
        </div>
      </section>

      <section className="brand-flow" aria-label="How branding works">
        <div className="wrap brand-flow-row">
          {steps.map((step) => (
            <article key={step.n} className="brand-flow-step">
              <span className="brand-flow-n">{step.n}</span>
              <h2>{step.title}</h2>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section brand-methods">
        <div className="wrap">
          <div className="section-head brand-methods-head">
            <div>
              <p className="eyebrow">How we mark it</p>
              <h2>Three ways to brand.</h2>
              <p>Pick the finish that fits the piece and the day.</p>
            </div>
          </div>
          <div className="brand-method-list">
            {methods.map((method, index) => (
              <article
                key={method.title}
                className={`brand-method${index % 2 === 1 ? " brand-method-flip" : ""}`}
              >
                <div className="brand-method-media">
                  <img src={method.image} alt={method.alt} />
                </div>
                <div className="brand-method-copy">
                  <p className="eyebrow">{String(index + 1).padStart(2, "0")}</p>
                  <h3>{method.title}</h3>
                  <p>{method.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section brand-surfaces">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">Surfaces</p>
              <h2>What takes a mark.</h2>
              <p>Shirts, caps, bottles, bags, and desk gifts from the same catalogue.</p>
            </div>
            <Link to="/shop" className="btn-dark">
              Shop lines
            </Link>
          </div>
          <div className="brand-surface-row">
            {surfaces.map((item) => (
              <Link key={item.label} to="/shop" className="brand-surface">
                <span className="brand-surface-media">
                  <img src={item.image} alt="" />
                </span>
                <span className="brand-surface-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="brand-cta">
        <div className="wrap brand-cta-inner">
          <p className="store-brand-mark brand-cta-mark">MODUS-EDGE</p>
          <h2>Send the artwork with the list.</h2>
          <p>
            The desk confirms placement, colour, and the total. Nothing is charged on this site.
          </p>
          <div className="store-hero-actions">
            <a className="btn-shop" href={wa} target="_blank" rel="noreferrer">
              WhatsApp the desk
            </a>
            <Link to="/contact" className="btn-ghost">
              Contact
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
