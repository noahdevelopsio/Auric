"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/store/toastStore";

const TOPICS = ["General question", "Bug report", "Partnership", "Press"] as const;

export default function ContactPage() {
  const { addToast } = useToastStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<typeof TOPICS[number]>(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = "Please enter your name";
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Please enter a valid email address";
    if (!message.trim()) nextErrors.message = "Please enter a message";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitted(true);
    addToast({ type: "success", message: "Message sent — thanks for reaching out!" });
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <h1 className="text-3xl font-headings font-bold text-text-primary">Contact</h1>
      <p className="mt-2 text-text-secondary">
        Questions, feedback, or partnership ideas — send us a message and we&apos;ll get back to
        you.
      </p>

      {submitted ? (
        <div className="mt-8 rounded-2xl border border-border-default bg-bg-surface p-8 text-center">
          <h2 className="text-lg font-headings font-semibold text-text-primary">Message sent</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Thanks, {name.split(" ")[0]} — we&apos;ve received your message and will respond as
            soon as we can.
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubmitted(false);
                setName("");
                setEmail("");
                setMessage("");
                setTopic(TOPICS[0]);
              }}
            >
              Send another message
            </Button>
          </div>
        </div>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <Input
            label="Name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />

          <div className="flex w-full flex-col gap-1.5">
            <label htmlFor="topic" className="text-sm font-medium text-text-secondary">Topic</label>
            <select
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value as typeof TOPICS[number])}
              className="h-11 w-full rounded-md border border-border-default bg-bg-overlay px-4 text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-border-strong hover:border-border-strong"
            >
              {TOPICS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex w-full flex-col gap-1.5">
            <label htmlFor="message" className="text-sm font-medium text-text-secondary">Message</label>
            <textarea
              id="message"
              rows={5}
              placeholder="How can we help?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`w-full rounded-md border bg-bg-overlay px-4 py-3 text-text-primary placeholder:text-text-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-border-strong resize-none ${
                errors.message ? "border-semantic-error focus:ring-semantic-error/50" : "border-border-default hover:border-border-strong"
              }`}
            />
            {errors.message && <p className="text-xs leading-5 text-semantic-error">{errors.message}</p>}
          </div>

          <Button type="submit" className="w-full sm:w-auto">Send message</Button>
        </form>
      )}
    </div>
  );
}
