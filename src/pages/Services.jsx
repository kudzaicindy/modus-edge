import { Link } from "react-router-dom";
import { useTitle } from "../useTitle";

const services = [
  {
    title: "In-house branding",
    text: "A company mark on shirts, hats, bottles, bags, gift sets, and the rest of the catalogue. Send the artwork and the size run, and the desk confirms the placement before the order is treated as final.",
    image: "/images/polo-lime.png",
    alt: "A lime golf polo",
  },
  {
    title: "Digital printing",
    text: "Names, numbers, and a short event line on the activ crew. Built for a society day or a range session, not for a full uniform program.",
    image: "/images/polo-pink.png",
    alt: "A pink golf polo",
  },
  {
    title: "Club gift sets",
    text: "A desk set with a notebook, a bottle or mug, a pen, a power bank, or a keyring, packed as a prize or a guest gift. The pieces are the same ones in the gift sets, desk, power, and bottles sections.",
    image: "/images/gift-bamboo-peach-box.png",
    alt: "A peach bamboo desk gift set in a black box",
  },
];

export default function Services() {
  useTitle("Services");
  return (
    <section className="section">
      <div className="wrap">
        <h1 className="catalogue-title">Services offered</h1>
        <p className="lede narrow-copy">
          We brand the pieces in the catalogue: print, embroidery, or a small mark on a blank face. A bulk order
          starts at 20 items. Send the artwork with the list and the desk confirms placement before the order is
          treated as final.
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
