import { useState } from "react";
import { useTitle } from "../useTitle";

const plans = [
  {
    id: "Guest",
    price: "$0",
    note: "Shop the full lineup",
    perks: ["Public pricing", "Standard shipping", "Journal notes"],
  },
  {
    id: "Player",
    price: "$12",
    cadence: "/ month",
    note: "The plan most members keep",
    perks: ["10% off the shop", "Early access", "Free shipping over $75"],
    featured: true,
  },
  {
    id: "Tour",
    price: "$29",
    cadence: "/ month",
    note: "For a yearly reset of the bag",
    perks: ["15% off the shop", "Free shipping", "One fitting a year"],
  },
];

export default function Membership() {
  useTitle("Membership");
  const [plan, setPlan] = useState("Player");
  const [form, setForm] = useState({ name: "", email: "", day: "Saturday morning" });
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Name and a real email are enough to hold a fitting.");
      return;
    }
    setError("");
    setDone(true);
  }

  return (
    <section className="section">
      <div className="wrap">
        <p className="eyebrow">Membership</p>
        <h1 className="shop-title">Exclusive golf deals for members only.</h1>
        <p className="lede narrow-copy">
          Limited slots for fittings. Plans below are a demo: choosing one doesn't bill a card.
        </p>
        <div className="plans">
          {plans.map((item) => (
            <article key={item.id} className={item.featured ? "plan featured" : "plan"}>
              <h2>{item.id}</h2>
              <p className="price-lg">
                {item.price}
                {item.cadence && <small>{item.cadence}</small>}
              </p>
              <p>{item.note}</p>
              <ul>
                {item.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
              <a
                href="#book"
                className={item.featured ? "btn-lime" : "btn-dark"}
                onClick={() => setPlan(item.id)}
              >
                Choose {item.id}
              </a>
            </article>
          ))}
        </div>

        <div id="book" className="book">
          <h2>Book a fitting</h2>
          <p className="muted">Bring the clubs you play. We'll talk ball, loft, and what to retire.</p>
          {done ? (
            <div className="success">
              <strong>You're on the sheet.</strong>
              <p>
                {form.name}, the {plan} desk saved {form.day}. No charge, and no email was sent.
              </p>
            </div>
          ) : (
            <form className="form-grid book-form" onSubmit={submit}>
              <label className="field">
                Name
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </label>
              <label className="field">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                />
              </label>
              <label className="field">
                Plan
                <select value={plan} onChange={(event) => setPlan(event.target.value)}>
                  {plans.map((item) => (
                    <option key={item.id}>{item.id}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Preferred time
                <select value={form.day} onChange={(event) => setForm((prev) => ({ ...prev, day: event.target.value }))}>
                  <option>Saturday morning</option>
                  <option>Sunday afternoon</option>
                  <option>Thursday evening</option>
                </select>
              </label>
              {error && <p className="error">{error}</p>}
              <button type="submit" className="btn-lime">
                Book Now
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
