import { Link } from "react-router-dom";
import { Heart, Instagram } from "lucide-react";
import Mark from "./Mark";
import { brand } from "../data";
import { whatsappHref } from "../order";

export default function Footer() {
  const cindyWa = whatsappHref("Hello Cindy, I found your work on MODUS-EDGE.", "263786209200");
  return (
    <footer className="site-footer">
      <div className="wrap foot-bar">
        <Link to="/" className="logo">
          <Mark />
          {brand.name}
        </Link>
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
        <a className="foot-credit" href={cindyWa} target="_blank" rel="noreferrer">
          Made with <Heart className="foot-heart" size={12} strokeWidth={0} fill="currentColor" aria-hidden="true" /> by Cindy
        </a>
      </div>
    </footer>
  );
}
