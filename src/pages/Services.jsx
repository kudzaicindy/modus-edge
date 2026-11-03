import { Link } from "react-router-dom";
import { useTitle } from "../useTitle";

const services = [
  {
    title: "In-house branding",
    text: "A club mark on the premium polos and the trucker cap. Send the artwork and the size run, and the desk confirms the placement before the order is treated as final.",
    image: "/images/swing.jpg",
    alt: "A lime golf polo mid-swing",
  },
  {
    title: "Digital printing",
    text: "Names, numbers, and a short event line on the activ crew. Built for a society day or a range session, not for a full uniform program.",
    image: "/images/polo.jpg",
    alt: "A white performance crew shirt",
  },
  {
    title: "Club gift sets",
    text: "A ball pack and a glove packed as a prize or a guest gift. The pieces are the same ones in the novelty gifts catalogue.",
    image: "/images/ball.jpg",
    alt: "A golf ball on the green",
  },
];

export default function Services() {
  useTitle("Services");
  return (
    <section className="section">
      <div className="wrap">
        <h1 className="catalogue-title">Services offered</h1>
        <p className="lede narrow-copy">
          Branding sits on the shirts and caps already in the catalogue. Pick the piece, then tell the desk what the
          mark should say.
        </p>
        <div className="service-list">
          {services.map((service) => (
            <article key={service.title}>
              <img src={service.image} alt={service.alt} />
              <div>
                <h2>{service.title}</h2>
                <p>{service.text}</p>
              </div>
            </article>
          ))}
        </div>
        <Link to="/contact" className="btn-dark">
          Ask about an order
        </Link>
      </div>
    </section>
  );
}
