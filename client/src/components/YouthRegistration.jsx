// src/pages/YouthRegistration.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Auth.module.css";
import { translateBatch } from "../lib/translateClient";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// Translatable strings
const BASE = {
  title: "Youth Registration",
  err_required: "Name, email, and password are required.",
  err_passwords: "Passwords do not match.",
  ok_registered: "Registered successfully.",
  name_label: "Full name",
  email_label: "Email",
  phone_label: "Phone",
  location_label: "Location",
  summary_label: "Summary",
  skills_label: "Skills",
  skills_ph: "e.g., Python, React, MongoDB",
  gender_label: "Gender",
  gender_opt_pref: "Prefer not to say",
  gender_opt_female: "Female",
  gender_opt_male: "Male",
  gender_opt_nb: "Non-binary",
  gender_opt_other: "Other",
  disability_label: "Disability",
  dis_opt_none: "None",
  dis_opt_visual: "Visual",
  dis_opt_hearing: "Hearing",
  dis_opt_mobility: "Mobility",
  dis_opt_cognitive: "Cognitive",
  dis_opt_other: "Other",
  password_label: "Password",
  confirm_label: "Confirm password",
  btn_register: "Register",
  btn_registering: "Registering…",
  btn_have_account: "Have an account? Login",
};

export default function YouthRegistration() {
  const nav = useNavigate();
  const [S, setS] = useState(BASE);
  const [isLangLoading, setIsLangLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    skills: "",
    password: "",
    confirm: "",
    role: "candidate",
    gender: "prefer not to say",
    disability: "None",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

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

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    if (!form.name || !form.email || !form.password) {
      setErr(S.err_required);
      return;
    }
    if (form.password !== form.confirm) {
      setErr(S.err_passwords);
      return;
    }
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      location: form.location,
      summary: form.summary,
      skills: form.skills,
      password: form.password,
      role: form.role,
      education: [],
      experience: [],
      gender: form.gender || "prefer not to say",
      disability: form.disability || "None",
    };
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail || data?.msg || "Registration failed");
      }
      if (data?.token) {
        localStorage.setItem("token", data.token);
        window.dispatchEvent(new CustomEvent("app:auth", { detail: { token: data.token } }));
      }
      setOk(S.ok_registered);
      setTimeout(() => nav("/"), 600);
    } catch (e) {
      setErr(e.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  const reqInvalid = (k) => !!err && !form[k];

  return (
    <main className={styles.authWrap}>
      <form className={styles.card} onSubmit={onSubmit} noValidate>
        <h1 className={styles.title}>{isLangLoading ? "…" : S.title}</h1>

        {err ? <div role="alert" className={styles.alert}>{err}</div> : null}
        {ok ? <div role="status" className={styles.success}>{ok}</div> : null}

        <label className={styles.label} htmlFor="name">{S.name_label}</label>
        <input
          id="name"
          className={styles.input}
          type="text"
          name="name"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          required
          autoComplete="name"
          aria-required="true"
          aria-invalid={reqInvalid("name") ? "true" : "false"}
        />

        <label className={styles.label} htmlFor="email">{S.email_label}</label>
        <input
          id="email"
          className={styles.input}
          type="email"
          name="email"
          value={form.email}
          onChange={(e) => setField("email", e.target.value)}
          required
          autoComplete="email"
          aria-required="true"
          aria-invalid={reqInvalid("email") ? "true" : "false"}
        />

        <label className={styles.label} htmlFor="phone">{S.phone_label}</label>
        <input
          id="phone"
          className={styles.input}
          type="tel"
          name="phone"
          value={form.phone}
          onChange={(e) => setField("phone", e.target.value)}
          autoComplete="tel"
        />

        <label className={styles.label} htmlFor="location">{S.location_label}</label>
        <input
          id="location"
          className={styles.input}
          type="text"
          name="location"
          value={form.location}
          onChange={(e) => setField("location", e.target.value)}
          autoComplete="address-level2"
        />

        <label className={styles.label} htmlFor="summary">{S.summary_label}</label>
        <textarea
          id="summary"
          className={styles.textarea}
          name="summary"
          rows={3}
          value={form.summary}
          onChange={(e) => setField("summary", e.target.value)}
        />

        <label className={styles.label} htmlFor="skills">{S.skills_label}</label>
        <input
          id="skills"
          className={styles.input}
          type="text"
          name="skills"
          placeholder={S.skills_ph}
          value={form.skills}
          onChange={(e) => setField("skills", e.target.value)}
          autoComplete="on"
        />

        <div className={styles.row2}>
          <div className={styles.col}>
            <label className={styles.label} htmlFor="gender">{S.gender_label}</label>
            <select
              id="gender"
              className={styles.select}
              value={form.gender}
              onChange={(e) => setField("gender", e.target.value)}
            >
              <option value="prefer not to say">{S.gender_opt_pref}</option>
              <option value="female">{S.gender_opt_female}</option>
              <option value="male">{S.gender_opt_male}</option>
              <option value="non-binary">{S.gender_opt_nb}</option>
              <option value="other">{S.gender_opt_other}</option>
            </select>
          </div>
          <div className={styles.col}>
            <label className={styles.label} htmlFor="disability">{S.disability_label}</label>
            <select
              id="disability"
              className={styles.select}
              value={form.disability}
              onChange={(e) => setField("disability", e.target.value)}
            >
              <option value="None">{S.dis_opt_none}</option>
              <option value="Visual">{S.dis_opt_visual}</option>
              <option value="Hearing">{S.dis_opt_hearing}</option>
              <option value="Mobility">{S.dis_opt_mobility}</option>
              <option value="Cognitive">{S.dis_opt_cognitive}</option>
              <option value="Other">{S.dis_opt_other}</option>
            </select>
          </div>
        </div>

        <label className={styles.label} htmlFor="password">{S.password_label}</label>
        <input
          id="password"
          className={styles.input}
          type="password"
          name="password"
          value={form.password}
          onChange={(e) => setField("password", e.target.value)}
          required
          autoComplete="new-password"
          aria-required="true"
          aria-invalid={reqInvalid("password") ? "true" : "false"}
        />

        <label className={styles.label} htmlFor="confirm">{S.confirm_label}</label>
        <input
          id="confirm"
          className={styles.input}
          type="password"
          name="confirm"
          value={form.confirm}
          onChange={(e) => setField("confirm", e.target.value)}
          required
          autoComplete="new-password"
          aria-required="true"
          aria-invalid={form.confirm && form.confirm !== form.password ? "true" : "false"}
        />

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={submitting}
            aria-busy={submitting ? "true" : "false"}
          >
            {submitting ? S.btn_registering : S.btn_register}
          </button>
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={() => nav("/login")}
          >
            {S.btn_have_account}
          </button>
        </div>
      </form>
    </main>
  );
}
