import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);

  function submit(event) {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setOk(false);
      setMessage("Enter an email so the notes have somewhere to land.");
      return;
    }
    setOk(true);
    setMessage("You're in. Watch for tour notes and member pricing.");
    setEmail("");
  }

  return (
    <section className="news-wrap" aria-label="Newsletter">
      <div className="news">
        <img src="/images/ball.jpg" alt="A golf ball resting on the lip of the cup" />
        <div className="news-copy">
          <p className="eyebrow light">Subscribe Now</p>
          <h2>Get Golf Tips & Exclusive Deals – Subscribe Now!</h2>
          <form onSubmit={submit}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your Email"
              aria-label="Email"
            />
            <button type="submit" aria-label="Subscribe">
              <ArrowRight size={18} />
            </button>
          </form>
          {message && <p className={ok ? "news-ok" : "news-err"}>{message}</p>}
        </div>
      </div>
    </section>
  );
}
