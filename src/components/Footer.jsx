import { Link } from "react-router-dom";
import Mark from "./Mark";
import { brand } from "../data";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap foot-bar">
        <Link to="/" className="logo">
          <Mark />
          {brand.name}
        </Link>
        <span>{brand.address}</span>
        {brand.phones.map((phone) => (
          <a key={phone} href={`tel:${phone}`}>
            {phone}
          </a>
        ))}
        <a href={`mailto:${brand.email}`}>{brand.email}</a>
        <span className="foot-copy">© 2026 {brand.name}</span>
      </div>
    </footer>
  );
}
