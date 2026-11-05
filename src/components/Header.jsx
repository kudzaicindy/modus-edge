import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Menu, ShoppingBag, X } from "lucide-react";
import Mark from "./Mark";
import { useCatalog } from "../catalog";
import { shopFilters as seedShopFilters } from "../data";
import { useCart } from "../cart";

const links = [
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Header() {
  const { count, setOpen } = useCart();
  const { shopFilters: liveFilters } = useCatalog();
  const shopFilters = liveFilters?.length ? liveFilters : seedShopFilters;
  const productLinks = useMemo(
    () => [
      { to: "/shop", label: "All products" },
      ...shopFilters
        .filter((filter) => filter.id !== "all")
        .map((filter) => ({ to: `/shop?cat=${filter.id}`, label: filter.label })),
    ],
    [shopFilters]
  );
  const [menu, setMenu] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const location = useLocation();
  const homeHot = location.pathname === "/";
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
          <NavLink to="/" className="logo logo-desktop" end>
            <Mark />
            MODUS-EDGE
          </NavLink>
        </div>

        <NavLink to="/" className="logo logo-mobile" end>
          <Mark />
          MODUS-EDGE
        </NavLink>

        <nav className="desktop-nav" aria-label="Primary">
          <NavLink to="/" end className={homeHot ? "active" : undefined}>
            Home
          </NavLink>
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
          <NavLink to="/" end>
            Home
          </NavLink>
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
