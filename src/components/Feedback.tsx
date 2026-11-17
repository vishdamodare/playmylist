"use client";

import React, { useEffect, useRef, useState } from "react";
import { Instagram, Mail, X } from "lucide-react";
import { api } from "@/lib/api";

const FACES = [
  { v: 4, e: "😍", label: "Love it" },
  { v: 3, e: "🙂", label: "It's nice" },
  { v: 2, e: "😐", label: "It's okay" },
  { v: 1, e: "😕", label: "Not for me" },
];

const INSTAGRAM = "vish_damodare";
const EMAIL = "vishdamodare10@gmail.com";

/** Vish's Instagram + email, used in the feedback dialog and the home footer. */
export function VishLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`pml-vish-links ${className}`}>
      <a href={`https://instagram.com/${INSTAGRAM}`} target="_blank" rel="noopener noreferrer">
        <Instagram size={15} aria-hidden="true" />
        <span>@{INSTAGRAM}</span>
      </a>
      <a href={`mailto:${EMAIL}?subject=${encodeURIComponent("Hi Vish, about PlayMyList")}`}>
        <Mail size={15} aria-hidden="true" />
        <span>{EMAIL}</span>
      </a>
    </div>
  );
}

const EVENT = "pml:feedback";
/** Opens the feedback dialog from anywhere (header link, mood bar, footer). */
export const openFeedback = () => window.dispatchEvent(new Event(EVENT));

/** Native <dialog> feedback form, opened via openFeedback(). Sends to /api/feedback; read it in /admin. */
export function Feedback({ page }: { page: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  const open = () => {
    setState("idle");
    setError("");
    ref.current?.showModal();
  };
  const close = () => ref.current?.close();
  useEffect(() => {
    window.addEventListener(EVENT, open);
    return () => window.removeEventListener(EVENT, open);
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || state === "sending") return;
    setState("sending");
    setError("");
    try {
      await api.sendFeedback({ message: message.trim(), rating, contact: contact.trim() || undefined, page });
      setState("sent");
      setMessage("");
      setContact("");
      setRating(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send, please try again");
      setState("idle");
    }
  };

  return (
    <>
      <dialog
        ref={ref}
        className="pml-fb"
        aria-labelledby="pml-fb-title"
        onClick={(e) => e.target === ref.current && close()} // click on the backdrop closes
      >
        <button className="pml-fb-x" onClick={close} aria-label="Close">
          <X size={18} />
        </button>

        {state === "sent" ? (
          <div className="pml-fb-thanks">
            <span className="pml-fb-heart" aria-hidden="true">♥</span>
            <h2 id="pml-fb-title">Thank you!</h2>
            <p>Vish reads every single note. It really helps make this place better.</p>
            <button className="pml-fb-send" onClick={close}>
              Back to the music
            </button>
            <p className="pml-fb-direct">Want to talk more? Follow or DM Vish</p>
            <VishLinks />
          </div>
        ) : (
          <form onSubmit={submit}>
            <h2 id="pml-fb-title">Tell us what you feel</h2>
            <p className="pml-fb-sub">Loved something? Something broke? Want a new mood? Say anything.</p>

            <fieldset className="pml-fb-faces">
              <legend>How&apos;s PlayMyList feeling?</legend>
              {FACES.map((f) => (
                <button
                  type="button"
                  key={f.v}
                  className={rating === f.v ? "on" : ""}
                  aria-pressed={rating === f.v}
                  aria-label={f.label}
                  title={f.label}
                  onClick={() => setRating((r) => (r === f.v ? null : f.v))}
                >
                  {f.e}
                </button>
              ))}
            </fieldset>

            <label className="pml-fb-field">
              <span>Your message</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                rows={5}
                required
                placeholder="I wish there was a mood for…"
              />
            </label>
            <label className="pml-fb-field">
              <span>
                How can we reach you? <i>(optional)</i>
              </span>
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                maxLength={120}
                placeholder="email or @instagram"
                autoComplete="email"
              />
            </label>

            {error && (
              <p className="pml-fb-error" role="alert">
                {error}
              </p>
            )}
            <button className="pml-fb-send" type="submit" disabled={!message.trim() || state === "sending"}>
              {state === "sending" ? "Sending…" : "Send feedback ♥"}
            </button>
            <VishLinks className="in-form" />
          </form>
        )}
      </dialog>
    </>
  );
}
