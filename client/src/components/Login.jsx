// src/pages/Login.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Auth.module.css";
import { translateBatch } from "../lib/translateClient";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// Translatable strings
const BASE = {
  title: "Login",
  email_label: "Email",
  password_label: "Password",
  required_both: "Email and password are required.",
  sign_in: "Sign in",
  signing_in: "Signing in…",
  login_failed: "Login failed",
};

export default function Login() {
  const nav = useNavigate();
  const [S, setS] = useState(BASE);
  const [isLangLoading, setIsLangLoading] = useState(false);

  // Auth form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  // Translate on mount and language changes
  useEffect(() => {
    let active = true;
    let ctrl = new AbortController();

    const doTranslate = async () => {
      const lang = localStorage.getItem("lang") || "en";
      if (lang === "en") {
        setS(BASE);
        setIsLangLoading(false);
        return;
      }
      setIsLangLoading(true);
      const keys = Object.keys(BASE).sort();
      const texts = keys.map((k) => BASE[k]);
      try {
        const translations = await translateBatch({
          src: "en",
          tgt: lang,
          texts,
          signal: ctrl.signal,
        });
        if (!active) return;
        const out = {};
        for (let i = 0; i < keys.length; i++) out[keys[i]] = translations[i] || BASE[keys[i]];
        setS(out);
      } catch {
        if (active) setS(BASE);
      } finally {
        if (active) setIsLangLoading(false);
      }
    };

    const onLang = () => {
      ctrl.abort();
      ctrl = new AbortController();
      doTranslate();
    };

    doTranslate();
    window.addEventListener("app:lang", onLang);
    window.addEventListener("storage", onLang);
    return () => {
      active = false;
      ctrl.abort();
      window.removeEventListener("app:lang", onLang);
      window.removeEventListener("storage", onLang);
    };
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!email || !password) {
      setErr(S.required_both);
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail || data?.msg || S.login_failed);
      }
      if (data?.token) {
        localStorage.setItem("token", data.token);
        window.dispatchEvent(new CustomEvent("app:auth", { detail: { token: data.token } }));
      }
      nav("/");
    } catch (e) {
      setErr(e.message || S.login_failed);
    } finally {
      setSubmitting(false);
    }
  }

  const emailInvalid = !!err && !email;
  const passwordInvalid = !!err && !password;

  return (
    <main className={styles.authWrap}>
      <form className={styles.card} onSubmit={onSubmit} noValidate>
        <h1 className={styles.title}>{isLangLoading ? "…" : S.title}</h1>

        {err ? (
          <div role="alert" className={styles.alert}>
            {err}
          </div>
        ) : null}

        <label className={styles.label} htmlFor="email">
          {S.email_label}
        </label>
        <input
          id="email"
          className={styles.input}
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          aria-required="true"
          aria-invalid={emailInvalid ? "true" : "false"}
        />

        <label className={styles.label} htmlFor="password">
          {S.password_label}
        </label>
        <input
          id="password"
          className={styles.input}
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          aria-required="true"
          aria-invalid={passwordInvalid ? "true" : "false"}
        />

        <button
          type="submit"
          className={styles.primaryBtn}
          disabled={submitting}
          aria-busy={submitting ? "true" : "false"}
        >
          {submitting ? S.signing_in : S.sign_in}
        </button>
      </form>
    </main>
  );
}
