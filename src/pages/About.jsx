import { Link } from "react-router-dom";
import { brand } from "../data";
import { useTitle } from "../useTitle";

const pillars = [
  {
    n: "01",
    title: "Vision",
    text: "To be the desk golf days and company teams open when they need kit on the course and a mark that reads clean.",
  },
  {
    n: "02",
    title: "Mission",
    text: "To stock golf wear and corporate gifts, then brand them with print, embroidery, or a stamp so a polo, cap, or gift set leaves with the right crest.",
  },
  {
    n: "03",
    title: "Values",
    text: "Course ready pieces, honest prices, and marks that still look sharp after a hot round.",
  },
];

export default function About() {
  useTitle("About");
  const phones = brand.phones.map((p) => `+263${p.slice(1)}`).join(" or ");
  const whatsapp = brand.whatsappDisplay;

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-wash" aria-hidden="true" />
        <div className="wrap about-hero-inner">
          <p className="about-hero-mark">MODUS-EDGE</p>
          <h1>Golf on the course. Your mark on the kit.</h1>
          <p>
            Wear, gifts, and branding for company days, club orders, and teams that want the crest on the piece before
            it leaves the desk.
          </p>
        </div>
      </section>

      <section className="section about-pillars" aria-label="Vision mission values">
        <div className="wrap">
          <div className="about-pillar-row">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="about-pillar">
                <span className="about-pillar-n">{pillar.n}</span>
                <h2>{pillar.title}</h2>
                <p>{pillar.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-desk">
        <div className="wrap about-desk-inner">
          <div className="about-desk-photo">
            <img src="/images/polo-piped.png" alt="Piped golf polos ready for a brand mark" />
          </div>
          <div className="about-desk-copy">
            <p className="eyebrow">The desk</p>
            <h2>MODUS-EDGE, where you order and brand the kit.</h2>
            <p>
              MODUS-EDGE supplies polos, caps, bags, balls, and corporate gifts for the course and the office. When you
              need a company or club mark, we print, embroider, or stamp it before the order goes out.
            </p>
            <p>
              Build a list in the catalogue, send it on WhatsApp to {whatsapp}, call {phones}, or email {brand.email}.
              The site does not charge a card.
            </p>
            <div className="about-desk-actions">
              <Link to="/services" className="btn-dark">
                Branding
              </Link>
              <Link to="/contact" className="btn-ghost-ink">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
