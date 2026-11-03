import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Menu, ShoppingBag, X } from "lucide-react";
import Mark from "./Mark";
import { useCart } from "../cart";

const productLinks = [
  { to: "/shop", label: "All products" },
  { to: "/shop?cat=shirts", label: "Golf t-shirts" },
  { to: "/shop?cat=caps", label: "Caps" },
  { to: "/shop?cat=bags", label: "Bags" },
  { to: "/shop?cat=clubs", label: "Clubs" },
  { to: "/shop?cat=gifts", label: "Balls and gloves" },
];

const links = [
  { to: "/shop?cat=shirts", label: "Golf t-shirts" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Header() {
  const { count, setOpen } = useCart();
  const [menu, setMenu] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const location = useLocation();
  const shopHot = location.pathname.startsWith("/shop") || location.pathname.startsWith("/product");

  useEffect(() => {
    setMenu(false);
    setProductsOpen(false);
  }, [location.pathname, location.search]);

  return (
    <header className="site-header">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="header-inner">
        <div className="header-start">
          <button
            type="button"
            className="icon-btn menu-btn"
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
            onClick={() => setMenu((open) => !open)}
          >
            {menu ? <X size={22} /> : <Menu size={22} />}
          </button>
          <NavLink to="/" className="logo" end>
            <Mark />
            MODUS-EDGE
          </NavLink>
        </div>
        <nav className="desktop-nav" aria-label="Primary">
          <div
            className="nav-drop"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button
              type="button"
              className={shopHot ? "active" : undefined}
              aria-expanded={productsOpen}
              onClick={() => setProductsOpen((open) => !open)}
            >
              Products <ChevronDown size={14} />
            </button>
            {productsOpen && (
              <div className="nav-panel">
                {productLinks.map((link) => (
                  <NavLink key={link.label} to={link.to}>
                    {link.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="icon-btn"
            aria-label={`Open list, ${count} items`}
            onClick={() => setOpen(true)}
          >
            <ShoppingBag size={20} />
            {count > 0 && <span className="count">{count > 9 ? "9+" : count}</span>}
          </button>
        </div>
      </div>
      {menu && (
        <nav className="mobile-nav" aria-label="Mobile">
          <p>Products</p>
          {productLinks.map((link) => (
            <NavLink key={link.label} to={link.to}>
              {link.label}
            </NavLink>
          ))}
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
