import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { partners } from "../data";
import { useTitle } from "../useTitle";

const slides = [
  {
    title: "Golf shirts",
    cta: "View more",
    to: "/shop?cat=shirts",
    image: "/images/swing.jpg",
    alt: "A golfer in a lime polo at the top of the backswing",
  },
  {
    title: "Hats and caps",
    cta: "Explore",
    to: "/shop?cat=headwear",
    image: "/images/cap.jpg",
    alt: "A white trucker cap",
  },
  {
    title: "Bags and gear",
    cta: "Shop now",
    to: "/shop?cat=gear",
    image: "/images/fairway.jpg",
    alt: "A golfer and bag on a links fairway",
  },
  {
    title: "Novelty gifts",
    cta: "View more",
    to: "/shop?cat=gifts",
    image: "/images/ball.jpg",
    alt: "A golf ball resting on the lip of the cup",
  },
];

const tiles = [
  {
    title: "Hats and caps",
    to: "/shop?cat=headwear",
    image: "/images/cap.jpg",
    alt: "A white trucker cap",
  },
  {
    title: "Golf shirts",
    to: "/shop?cat=shirts",
    image: "/images/putt.jpg",
    alt: "A golfer in a navy polo lining up a putt",
  },
  {
    title: "Novelty gifts",
    to: "/shop?cat=gifts",
    image: "/images/glove.jpg",
    alt: "A leather golf glove",
  },
  {
    title: "Custom products",
    to: "/services",
    image: "/images/polo.jpg",
    alt: "A white performance crew shirt",
  },
];

const promos = [
  {
    title: "Course gear",
    cta: "Shop now",
    to: "/shop?cat=gear",
    image: "/images/cart1.jpg",
    alt: "A course cart with a staff bag",
  },
  {
    title: "Gift sets",
    cta: "View more",
    to: "/shop?cat=gifts",
    image: "/images/ball.jpg",
    alt: "A golf ball on the green",
  },
];

export default function Home() {
  useTitle();
  const [index, setIndex] = useState(0);
  const [promo, setPromo] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[index];
  const band = promos[promo];

  return (
    <>
      <section className="stage" aria-roledescription="carousel" aria-label="Featured catalogues">
        {slides.map((item, itemIndex) => (
          <img
            key={item.title}
            className={itemIndex === index ? "stage-photo on" : "stage-photo"}
            src={item.image}
            alt={itemIndex === index ? item.alt : ""}
          />
        ))}
        <div className="stage-shade" />
        <div className="stage-copy">
          <h1>{slide.title}</h1>
          <Link to={slide.to} className="stage-cta">
            {slide.cta}
          </Link>
        </div>
        <div className="stage-nav">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => setIndex((current) => (current - 1 + slides.length) % slides.length)}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => setIndex((current) => (current + 1) % slides.length)}
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </section>

      <section className="split" aria-label="Shop by category">
        {tiles.map((tile) => (
          <article key={tile.title} className="split-card">
            <img src={tile.image} alt={tile.alt} />
            <div className="split-copy">
              <h2>{tile.title}</h2>
              <Link to={tile.to}>Explore</Link>
            </div>
          </article>
        ))}
      </section>

      <section className="promo" aria-label="More catalogues">
        <img src={band.image} alt={band.alt} />
        <div className="stage-shade" />
        <div className="stage-copy">
          <h2>{band.title}</h2>
          <Link to={band.to} className="stage-cta">
            {band.cta}
          </Link>
        </div>
        <div className="stage-nav">
          <button
            type="button"
            aria-label="Previous promotion"
            onClick={() => setPromo((current) => (current - 1 + promos.length) % promos.length)}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="Next promotion"
            onClick={() => setPromo((current) => (current + 1) % promos.length)}
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </section>

      <section className="trusted" aria-label="Clubs and companies">
        <p>we are trusted by these clubs</p>
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
