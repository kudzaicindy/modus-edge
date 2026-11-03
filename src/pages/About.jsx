import { Link } from "react-router-dom";
import { useTitle } from "../useTitle";

const pillars = [
  {
    title: "Vision",
    text: "To be the catalogue companies open when they need bags, clubs, caps, balls, or a golf t-shirt for the course.",
  },
  {
    title: "Mission",
    text: "To keep bags, clubs, caps, golf t-shirts, balls, and gloves in their own sections, and to mark them so a company order is straightforward.",
  },
  {
    title: "Values",
    text: "A clear lineup, honest prices, and pieces that still look right after a hot round.",
  },
];

export default function About() {
  useTitle("About");
  return (
    <section className="section">
      <div className="wrap">
        <h1 className="catalogue-title">About us</h1>
        <h2 className="catalogue-sub">Our direction</h2>
        <div className="pillar-grid">
          {pillars.map((pillar) => (
            <article key={pillar.title}>
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </article>
          ))}
        </div>
        <div className="about-band">
          <img src="/images/portrait.jpg" alt="A golfer looking down the fairway" />
          <div>
            <h2>The desk</h2>
            <p>
              MODUS-EDGE supplies the corporate golf day: bags, clubs, caps, and golf t-shirts, with a mark put on the
              piece before it goes out. The desk is at 821 Ferguson Avenue, Greendale.
            </p>
            <p>
              Custom marks on shirts and caps are handled as a service. Add the pieces you want, then send the list on
              WhatsApp. Call +263716055533 or +263783055893, or email modusedgezw@gmail.com. The site does not charge a
              card.
            </p>
            <Link to="/contact" className="btn-dark">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
