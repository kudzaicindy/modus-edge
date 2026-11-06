import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
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
        {brand.instagram ? (
          <a
            className="social-icon-link"
            href={brand.instagram}
            target="_blank"
            rel="noreferrer"
            aria-label={`Instagram ${brand.instagramHandle || ""}`.trim()}
            title={brand.instagramHandle || "Instagram"}
          >
            <Instagram size={18} strokeWidth={1.8} aria-hidden="true" />
          </a>
        ) : null}
        <span className="foot-copy">© 2026 {brand.name}</span>
      </div>
    </footer>
  );
}
