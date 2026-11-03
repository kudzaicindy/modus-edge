import { useState } from "react";
import Mark from "../components/Mark";
import { brand } from "../data";
import { whatsappHref } from "../order";
import { useTitle } from "../useTitle";

export default function Contact() {
  useTitle("Contact");
  const [form, setForm] = useState({ name: "", email: "", note: "" });
  const [error, setError] = useState("");

  function update(key) {
    return (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email) || !form.note.trim()) {
      setError("Name, email, and a note are enough.");
      return;
    }
    setError("");
    const subject = encodeURIComponent(`Query from ${form.name.trim()}`);
    const body = encodeURIComponent(`${form.note.trim()}\n\n${form.name.trim()}\n${form.email.trim()}`);
    window.location.href = `mailto:${brand.email}?subject=${subject}&body=${body}`;
  }

  return (
    <section className="section">
      <div className="wrap contact-layout">
        <div>
          <h1 className="catalogue-title">Contact</h1>
          <div className="contact-card">
            <p className="logo">
              <Mark />
              {brand.name}
            </p>
            <p className="swing-banner">Swing-Elegance</p>
            <p>{brand.address}</p>
            {brand.phones.map((phone) => (
              <a key={phone} href={`tel:${phone}`}>
                {phone}
              </a>
            ))}
            <a href={`mailto:${brand.email}`}>{brand.email}</a>
            <a href={whatsappHref("Hello MODUS-EDGE, I have a question about the catalogue.")}>
              WhatsApp {brand.whatsappDisplay}
            </a>
          </div>
        </div>
        <div>
          <h2>Have specific queries?</h2>
          <p className="lede">
            Ask about a shirt size, a cap order, or a mark for the club. Send opens an email to {brand.email}.
          </p>
          <form className="form-grid book-form" onSubmit={submit}>
            <label className="field">
              Name
              <input value={form.name} onChange={update("name")} />
            </label>
            <label className="field">
              Email
              <input type="email" value={form.email} onChange={update("email")} />
            </label>
            <label className="field">
              Query
              <textarea rows={5} value={form.note} onChange={update("note")} />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn-dark">
              Send
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
