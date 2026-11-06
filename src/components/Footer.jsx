import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import Mark from "./Mark";
import { brand } from "../data";
import { whatsappLinks } from "../order";

export default function Footer() {
  const wa = whatsappLinks(`Hello ${brand.name}, I have a question about the catalogue.`);
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
        {wa.map((line) => (
          <a key={line.id} href={line.href} target="_blank" rel="noreferrer">
            WhatsApp {line.display}
          </a>
        ))}
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
