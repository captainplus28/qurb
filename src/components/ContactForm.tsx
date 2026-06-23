"use client";

import { useRef, useState } from "react";

/** Contact form — ported verbatim from contact.html (Formspree POST + status
 *  toggling). Endpoint and field names are unchanged. */
export default function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setSubmitting(true);
    setOk(false);
    setErr(false);
    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        setOk(true);
        form.reset();
      } else {
        setErr(true);
      }
    } catch {
      setErr(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="form"
      id="contact-form"
      action="https://formspree.io/f/xzdqjznw"
      method="POST"
      ref={formRef}
      onSubmit={onSubmit}
    >
      {/* Honeypot for spambots */}
      <input
        type="text"
        name="_gotcha"
        style={{ display: "none" }}
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="field--row">
        <div className="field">
          <label htmlFor="naam">
            Naam <span aria-hidden="true">*</span>
          </label>
          <input
            type="text"
            id="naam"
            name="naam"
            required
            autoComplete="name"
            placeholder="Jan de Vries"
          />
        </div>
        <div className="field">
          <label htmlFor="email">
            E-mailadres <span aria-hidden="true">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            autoComplete="email"
            placeholder="jou@voorbeeld.nl"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="reden">
          Reden van contact <span aria-hidden="true">*</span>
        </label>
        <select id="reden" name="reden" required defaultValue="">
          <option value="" disabled>
            Kies een onderwerp…
          </option>
          <option value="Vraag">Vraag</option>
          <option value="Feedback">Feedback</option>
          <option value="Ontbrekende parkeerzone">Ontbrekende parkeerzone</option>
          <option value="Samenwerking / partnership">
            Samenwerking / partnership
          </option>
          <option value="Bug melden">Bug melden</option>
          <option value="Anders">Anders</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="bericht">
          Bericht <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="bericht"
          name="bericht"
          required
          placeholder="Schrijf hier je bericht…"
        ></textarea>
      </div>

      <div
        id="form-status-ok"
        className="form-status form-status--ok"
        role="alert"
        aria-live="polite"
        hidden={!ok}
      >
        Bedankt voor je bericht! We nemen zo snel mogelijk contact op.
      </div>
      <div
        id="form-status-err"
        className="form-status form-status--err"
        role="alert"
        aria-live="polite"
        hidden={!err}
      >
        Er ging iets mis. Probeer het opnieuw of stuur een mail naar{" "}
        <a href="mailto:hello@qurb.nl" style={{ color: "inherit", fontWeight: 700 }}>
          hello@qurb.nl
        </a>
        .
      </div>

      <button
        type="submit"
        className="submit-btn"
        id="submit-btn"
        disabled={submitting}
      >
        {submitting ? "Versturen…" : "Verstuur bericht"}
      </button>
    </form>
  );
}
