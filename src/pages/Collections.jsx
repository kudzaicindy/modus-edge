import { Link } from "react-router-dom";
import { collections } from "../data";
import { useTitle } from "../useTitle";

export default function Collections() {
  useTitle("Collections");
  return (
    <section className="section">
      <div className="wrap">
        <h1 className="catalogue-title">All products</h1>
        <p className="lede narrow-copy">
          Golf wear, shoes, bags, clubs, drinkware, and gifts, each in its own section.
        </p>
        <div className="coll-grid">
          {collections.map((collection) => (
            <Link
              key={collection.title}
              to={collection.to}
              className={collection.wide ? "coll-card wide" : "coll-card"}
            >
              <img src={collection.image} alt="" />
              <span className="shade" />
              <div>
                <h2>{collection.title}</h2>
                <p>{collection.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
