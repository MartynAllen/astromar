"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          website: data.get("website"), // honeypot
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || "Something went wrong sending your message");
      }
      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <div className="border border-void-700 bg-void-900 p-5" role="status">
        <p className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
          Message sent
        </p>
        <p className="mt-2 text-sm text-star-300">
          Thanks — that&apos;s on its way. I read every message myself and&apos;ll get back to you
          as soon as I can.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Honeypot — real visitors never see this field (visually hidden and
          removed from tab order / screen-reader flow); a bot that blindly
          fills every input in the DOM fills it too, which the API route
          reads as a silent signal to drop the submission. */}
      <div className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="name" className="block text-xs uppercase tracking-widest text-star-500">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          maxLength={200}
          className="mt-1.5 w-full border border-void-600 bg-void-950 px-3 py-2 text-sm text-star-100 placeholder:text-star-700 focus:border-nebula-teal-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-xs uppercase tracking-widest text-star-500">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          maxLength={200}
          className="mt-1.5 w-full border border-void-600 bg-void-950 px-3 py-2 text-sm text-star-100 placeholder:text-star-700 focus:border-nebula-teal-500"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-xs uppercase tracking-widest text-star-500">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          maxLength={5000}
          rows={6}
          className="mt-1.5 w-full border border-void-600 bg-void-950 px-3 py-2 text-sm text-star-100 placeholder:text-star-700 focus:border-nebula-teal-500"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-nebula-rose-400" role="alert">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="min-h-11 border border-nebula-rose-400 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-nebula-rose-400 transition-colors hover:bg-nebula-rose-400 hover:text-void-950 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-nebula-rose-400"
      >
        {status === "loading" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
