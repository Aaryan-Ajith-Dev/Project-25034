// src/pages/Form.jsx
import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import s from "../styles/Form.module.css";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { translateBatch } from "../lib/translateClient";

const BASE = {
  title_add_update: "Add/Update Preferences",
  upload_resume: "Upload Resume",
  select_file: "Select file",
  allowed_hint: "Allowed: .pdf, .doc, .docx, .txt, .rtf",
  parsing_resume: "Parsing resume…",
  parse_failed: "Failed to parse resume",
  form_profile: "Profile",
  name_label: "Name",
  name_ph: "e.g., Jane Doe",
  email_label: "Email",
  email_ph: "e.g., jane@example.com",
  phone_label: "Phone",
  phone_ph: "e.g., 9876543210",
  phone_numbers_only: "Phone can only contain numbers",
  phone_required: "Phone is required",
  location_label: "Location",
  location_ph: "e.g., Bengaluru, IN",
  detect_location: "Detect location",
  detecting: "Detecting...",
  location_unavailable_short: "Location unavailable",
  location_unavailable_long: "Location unavailable. Please enter manually...",
  summary_label: "Summary",
  summary_ph: "Anything you'd like to share…",

  education_section: "Education",
  school_label: "School",
  school_ph: "e.g., IIT Delhi",
  degree_label: "Degree",
  degree_ph: "e.g., B.Tech, CSE",
  grade_label: "Grade",
  grade_ph: "e.g., 90 (percentage)",
  start_date: "Start Date",
  end_date: "End Date",
  currently_pursuing: "Currently Pursuing",
  notes_label: "Notes",
  notes_ph_edu: "e.g., CGPA 8.5; President - Coding Club",
  remove: "Remove",
  add_education: "+ Add Education",

  work_section: "Work Experience",
  company_label: "Company",
  company_ph: "e.g., Acme Corp",
  title_label: "Title",
  title_ph: "e.g., Frontend Developer",
  descriptions_label: "Descriptions",
  descriptions_ph: "e.g., Built React apps; Led 3 engineers; Drove Lighthouse 95+",
  add_work: "+ Add Work Experience",

  skills_section: "Skills",
  skills_label: "Skills",
  skills_ph: "e.g., React, Node.js, Docker",
  skills_note: "Note: Use commas to separate skills",
  skills_required: "Skills are required",

  voluntary_section: "Self Voluntary",
  gender_label: "Gender",
  gender_select: "Select",
  gender_male: "Male",
  gender_female: "Female",
  gender_other: "Other",
  disabled_q: "Are you disabled?",
  no: "No",
  yes: "Yes",
  accommodations_label: "Accommodations Needed",
  accommodations_ph: "Describe your needs",

  final_section: "Anything else you want Hirer to know",
  final_notes_label: "Notes",
  final_notes_ph: "Any additional information for the hirer…",

  submit: "Submit",

  // Errors
  end_after_start: "End date must be after start date",
  grade_between: "Grade must be between 0 and 100",
};

export default function Form() {
  // Minimal translation state
  const [S, setS] = useState(BASE);
  const [isLangLoading, setIsLangLoading] = useState(false);

  // Existing state
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [phoneErr, setPhoneErr] = useState("");
  const [dateErrs, setDateErrs] = useState({});
  const [gradeErrs, setGradeErrs] = useState({});
  const [touched, setTouched] = useState({});

  const [gender, setGender] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const [accommodations, setAccommodations] = useState("");
  const fileInputRef = useRef(null);

  const images = ["/img_1.png", "/img_2.png"];

  const emptyData = useMemo(
    () => ({
      profile: { name: "", email: "", phone: "", location: "", links: [], summary: "" },
      education: [],
      work: [],
      skills: [],
      total_experience: 0,
    }),
    []
  );

  const markTouched = (key) => setTouched((prev) => ({ ...prev, [key]: true }));
  const requiredInvalid = (val) => !val || (typeof val === "string" && val.trim().length === 0);

  const handlePhone = (value) => {
    if (!/^\d{0,15}$/.test(value.replace(/\s/g, ""))) {
      setPhoneErr(S.phone_numbers_only);
    } else {
      setPhoneErr("");
      setParsed((prev) => ({
        ...(prev || emptyData),
        profile: { ...(prev?.profile || emptyData.profile), phone: value },
      }));
    }
  };

  // Resume upload
  const APILAYER_API_BASE = "https://api.apilayer.com";
  const APILAYER_API_KEY = "WeyA9koQKcmZrsXercUgiIVnR8kPf5wG";

  const handleUpload = useCallback(
    async (file) => {
      if (!file) return;
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`${APILAYER_API_BASE}/resume_parser/upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            apikey: APILAYER_API_KEY,
          },
          body: file,
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(`APILayer ${res.status}: ${t || "request failed"}`);
        }
        const json = await res.json();
        setParsed(normalizeApilayerToForm(json) || emptyData);
      } catch (e) {
        setErr(e?.message || S.parse_failed);
        setParsed(null);
      } finally {
        setLoading(false);
      }
    },
    [emptyData, S.parse_failed]
  );

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const p = parsed || emptyData;

  // Add/remove lists
  const addEducation = () =>
    setParsed((prev) => {
      const base = prev || emptyData;
      return {
        ...base,
        education: [
          ...(base.education || []),
          { school: "", degree: "", grade: "", startDate: "", endDate: "", current: false, descriptions: [] },
        ],
      };
    });

  const removeEducation = (idx) =>
    setParsed((prev) => {
      const base = prev || emptyData;
      const next = [...(base.education || [])];
      next.splice(idx, 1);
      return { ...base, education: next };
    });

  const addWork = () =>
    setParsed((prev) => {
      const base = prev || emptyData;
      return {
        ...base,
        work: [
          ...(base.work || []),
          { company: "", title: "", startDate: "", endDate: "", current: false, descriptions: [] },
        ],
      };
    });

  const removeWork = (idx) =>
    setParsed((prev) => {
      const base = prev || emptyData;
      const next = [...(base.work || [])];
      next.splice(idx, 1);
      return { ...base, work: next };
    });

  // Validation helpers
  const validateDates = (items, field) => {
    const errs = { ...dateErrs };
    items.forEach((item, idx) => {
      if (item.startDate && item.endDate && !item.current && item.endDate < item.startDate) {
        errs[`${field}_${idx}`] = S.end_after_start;
      } else {
        delete errs[`${field}_${idx}`];
      }
    });
    setDateErrs(errs);
  };

  const handleDateChange = (field, idx, key, value) => {
    setParsed((prev) => {
      const base = prev || emptyData;
      const next = [...(base[field] || [])];
      next[idx] = { ...(next[idx] || {}), [key]: value };
      return { ...base, [field]: next };
    });
    validateDates(
      (parsed ? parsed[field] : emptyData[field]).map((itm, i) => (i === idx ? { ...itm, [key]: value } : itm)),
      field
    );
  };

  const handleCurrentChange = (field, idx, checked) => {
    setParsed((prev) => {
      const base = prev || emptyData;
      const next = [...(base[field] || [])];
      next[idx] = { ...(next[idx] || {}), current: checked, ...(checked ? { endDate: "" } : {}) };
      return { ...base, [field]: next };
    });
    validateDates(
      (parsed ? parsed[field] : emptyData[field]).map((itm, i) =>
        i === idx ? { ...itm, current: checked, ...(checked ? { endDate: "" } : {}) } : itm
      ),
      field
    );
  };

  const handleGradeChange = (idx, value) => {
    const digits = value.replace(/\D/g, "");
    const num = digits === "" ? "" : parseInt(digits, 10);
    setParsed((prev) => {
      const base = prev || emptyData;
      const next = [...(base.education || [])];
      next[idx] = { ...(next[idx] || {}), grade: digits === "" ? "" : String(num) };
      return { ...base, education: next };
    });
    setGradeErrs((prev) => {
      const key = `education_${idx}`;
      const out = { ...prev };
      if (digits === "") {
        delete out[key];
      } else if (Number.isNaN(num) || num < 0 || num > 100) {
        out[key] = S.grade_between;
      } else {
        delete out[key];
      }
      return out;
    });
  };

  // Disable UI during language switching or upload
  const disableUI = isLangLoading || loading;
  const busyAttr = disableUI ? "true" : "false";

  // Minimal translation: react to app:lang and storage; translate on mount and on change
  useEffect(() => {
    let active = true;
    let ctrl = new AbortController();

    const translateNow = async () => {
      const lang = localStorage.getItem("lang") || "en";
      // Fast path for English (no backend call)
      if (lang === "en") {
        setIsLangLoading(false);
        setS(BASE);
        return;
      }

      setIsLangLoading(true);
      const keysSorted = Object.keys(BASE).sort();
      const texts = keysSorted.map((k) => BASE[k]);
      try {
        const translations = await translateBatch({
          src: "en",
          tgt: lang,
          texts,
          signal: ctrl.signal,
        });
        if (!active) return;
        const out = {};
        for (let i = 0; i < keysSorted.length; i++) out[keysSorted[i]] = translations[i] || BASE[keysSorted[i]];
        setS(out);
      } catch (err) {
        if (err?.name !== "AbortError") {
          setS(BASE);
        }
      } finally {
        if (active) setIsLangLoading(false);
      }
    };

    const onLang = () => {
      // Abort any in-flight request and start a new one
      ctrl.abort();
      ctrl = new AbortController();
      translateNow();
    };

    // Initial translate
    translateNow();

    // Listen for language changes
    window.addEventListener("app:lang", onLang);
    window.addEventListener("storage", onLang);

    // Cleanup
    return () => {
      active = false;
      ctrl.abort();
      window.removeEventListener("app:lang", onLang);
      window.removeEventListener("storage", onLang);
    };
  }, []);

  return (
    <div className={s.container} aria-busy={busyAttr}>
      <h2 className={s.title}>
        {isLangLoading ? <span className={s.skeletonLine} style={{ width: 240 }} /> : S.title_add_update}
      </h2>

      <div className={s.shell}>
        {/* Left: form */}
        <div className={s.left}>
          <div className={s.uploadCard}>
            <div className={s.uploadHead}>
              {isLangLoading ? <span className={s.skeletonLine} style={{ width: 180 }} /> : S.upload_resume}
            </div>
            <div className={s.uploadBody}>
              <input
                id="resumeFile"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf"
                onChange={onFileChange}
                className={s.visuallyHidden}
                disabled={disableUI}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={s.buttonPrimary}
                disabled={disableUI}
                aria-controls="resumeFile"
                aria-busy={busyAttr}
                title={disableUI ? "Please wait…" : S.select_file}
              >
                {loading ? S.parsing_resume : isLangLoading ? "…" : S.select_file}
              </button>
              <div className={s.hint}>
                {isLangLoading ? <span className={s.skeletonLine} style={{ width: 220 }} /> : S.allowed_hint}
              </div>
            </div>
          </div>

          {loading && <p className={s.info}>{S.parsing_resume}</p>}
          {err && <p className={s.errorText}>{err}</p>}

          <form className={s.form} autoComplete="off">
            {/* Profile */}
            <fieldset className={s.section} disabled={disableUI} aria-busy={busyAttr}>
              <legend className={s.legend}>
                {isLangLoading ? <span className={s.skeletonLine} style={{ width: 120 }} /> : S.form_profile}
              </legend>

              <div className={s.row}>
                <label className={s.label}>{S.name_label}</label>
                <input
                  className={`${s.input} ${touched.name && nameInvalid ? s.invalid : ""}`}
                  type="text"
                  placeholder={S.name_ph}
                  value={p.profile.name}
                  onChange={(e) =>
                    setParsed((prev) => ({
                      ...(prev || emptyData),
                      profile: { ...(prev?.profile || emptyData.profile), name: e.target.value },
                    }))
                  }
                  onBlur={() => markTouched("name")}
                  required
                  disabled={disableUI}
                />
              </div>

              <div className={s.row}>
                <label className={s.label}>{S.email_label}</label>
                <input
                  className={`${s.input} ${touched.email && emailInvalid ? s.invalid : ""}`}
                  type="email"
                  placeholder={S.email_ph}
                  value={p.profile.email}
                  onChange={(e) =>
                    setParsed((prev) => ({
                      ...(prev || emptyData),
                      profile: { ...(prev?.profile || emptyData.profile), email: e.target.value },
                    }))
                  }
                  onBlur={() => markTouched("email")}
                  required
                  disabled={disableUI}
                />
              </div>

              <div className={s.row}>
                <label className={s.label}>{S.phone_label}</label>
                <div>
                  <input
                    className={`${s.input} ${touched.phone && phoneInvalid ? s.invalid : ""}`}
                    type="text"
                    placeholder={S.phone_ph}
                    value={p.profile.phone}
                    onChange={(e) => handlePhone(e.target.value)}
                    onBlur={() => markTouched("phone")}
                    inputMode="numeric"
                    required
                    disabled={disableUI}
                  />
                  {touched.phone && phoneInvalid && (
                    <div className={s.errorText}>{phoneErr || S.phone_required}</div>
                  )}
                </div>
              </div>

              <div className={s.row}>
                <label className={s.label}>{S.location_label}</label>
                <div className={s.inputWrap}>
                  <input
                    className={`${s.input} ${touched.location && locationInvalid ? s.invalid : ""}`}
                    type="text"
                    placeholder={S.location_ph}
                    value={p.profile.location}
                    onChange={(e) =>
                      setParsed((prev) => ({
                        ...(prev || emptyData),
                        profile: { ...(prev?.profile || emptyData.profile), location: e.target.value },
                      }))
                    }
                    onBlur={() => markTouched("location")}
                    required
                    disabled={disableUI}
                  />
                  <button
                    type="button"
                    className={s.inputIconEnd}
                    onClick={() =>
                      setParsed((prev) => ({
                        ...(prev || emptyData),
                        profile: { ...(prev?.profile || emptyData.profile), location: S.detecting },
                      }))
                    }
                    aria-label={S.detect_location}
                    title={S.detect_location}
                    disabled={disableUI}
                  >
                    <MapPinIcon className={s.icon} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className={s.row}>
                <label className={s.label}>{S.summary_label}</label>
                <div>
                  <textarea
                    className={`${s.textarea} ${touched.summary && summaryInvalid ? s.invalid : ""}`}
                    rows={4}
                    placeholder={S.summary_ph}
                    value={p.profile.summary}
                    onChange={(e) =>
                      setParsed((prev) => ({
                        ...(prev || emptyData),
                        profile: { ...(prev?.profile || emptyData.profile), summary: e.target.value },
                      }))
                    }
                    onBlur={() => markTouched("summary")}
                    required
                    disabled={disableUI}
                  />
                </div>
              </div>
            </fieldset>

            {/* Education */}
            <fieldset className={s.section} disabled={disableUI} aria-busy={busyAttr}>
              <legend className={s.legend}>{S.education_section}</legend>

              {(p.education || []).map((ed, idx) => (
                <div key={idx} className={s.card}>
                  <div className={s.row}>
                    <label className={s.label}>{S.school_label}</label>
                    <input
                      className={s.input}
                      type="text"
                      placeholder={S.school_ph}
                      value={ed.school || ""}
                      onChange={(e) =>
                        setParsed((prev) => {
                          const base = prev || emptyData;
                          const next = [...(base.education || [])];
                          next[idx] = { ...(next[idx] || {}), school: e.target.value };
                          return { ...base, education: next };
                        })
                      }
                      disabled={disableUI}
                    />
                  </div>

                  <div className={s.row}>
                    <label className={s.label}>{S.degree_label}</label>
                    <input
                      className={s.input}
                      type="text"
                      placeholder={S.degree_ph}
                      value={ed.degree || ""}
                      onChange={(e) =>
                        setParsed((prev) => {
                          const base = prev || emptyData;
                          const next = [...(base.education || [])];
                          next[idx] = { ...(next[idx] || {}), degree: e.target.value };
                          return { ...base, education: next };
                        })
                      }
                      disabled={disableUI}
                    />
                  </div>

                  <div className={s.row}>
                    <label className={s.label}>{S.grade_label}</label>
                    <div>
                      <input
                        className={`${s.input} ${gradeErrs[`education_${idx}`] ? s.invalid : ""}`}
                        type="text"
                        inputMode="numeric"
                        placeholder={S.grade_ph}
                        value={ed.grade ?? ""}
                        onChange={(e) => handleGradeChange(idx, e.target.value)}
                        disabled={disableUI}
                      />
                      {gradeErrs[`education_${idx}`] && (
                        <div className={s.errorText}>{gradeErrs[`education_${idx}`]}</div>
                      )}
                    </div>
                  </div>

                  <div className={s.row}>
                    <label className={s.label}>{S.start_date}</label>
                    <input
                      className={s.input}
                      type="date"
                      value={ed.startDate || ""}
                      onChange={(e) => handleDateChange("education", idx, "startDate", e.target.value)}
                      disabled={disableUI}
                    />
                  </div>

                  <div className={s.row}>
                    <label className={s.label}>{S.end_date}</label>
                    <div className={s.inputWrap}>
                      <input
                        className={`${s.input} ${ed.current ? s.disabledField : ""}`}
                        type="date"
                        value={ed.endDate || ""}
                        onChange={(e) => handleDateChange("education", idx, "endDate", e.target.value)}
                        disabled={disableUI || !!ed.current}
                      />
                    </div>
                  </div>

                  <div className={s.row}>
                    <label className={s.label}></label>
                    <div className={s.radioRow}>
                      <label>
                        <input
                          type="checkbox"
                          checked={!!ed.current}
                          onChange={(e) => handleCurrentChange("education", idx, e.target.checked)}
                          disabled={disableUI}
                        />{" "}
                        {S.currently_pursuing}
                      </label>
                    </div>
                  </div>

                  {dateErrs[`education_${idx}`] && (
                    <div className={s.row}>
                      <label className={s.label}></label>
                      <div className={s.errorText}>{dateErrs[`education_${idx}`]}</div>
                    </div>
                  )}

                  <div className={s.row}>
                    <label className={s.label}>{S.notes_label}</label>
                    <textarea
                      className={s.textarea}
                      rows={3}
                      placeholder={S.notes_ph_edu}
                      value={(ed.descriptions || []).join("\n")}
                      onChange={(e) =>
                        setParsed((prev) => {
                          const base = prev || emptyData;
                          const next = [...(base.education || [])];
                          next[idx] = {
                            ...(next[idx] || {}),
                            descriptions: e.target.value
                              .split("\n")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          };
                          return { ...base, education: next };
                        })
                      }
                      disabled={disableUI}
                    />
                  </div>

                  <div className={s.cardActions}>
                    <button type="button" className={s.buttonGhost} onClick={() => removeEducation(idx)} disabled={disableUI}>
                      {S.remove}
                    </button>
                  </div>
                </div>
              ))}

              <div className={s.addRow}>
                <button type="button" className={s.buttonPrimary} onClick={addEducation} disabled={disableUI}>
                  {S.add_education}
                </button>
              </div>
            </fieldset>

            {/* Work */}
            <fieldset className={s.section} disabled={disableUI} aria-busy={busyAttr}>
              <legend className={s.legend}>{S.work_section}</legend>

              {(p.work || []).map((w, idx) => (
                <div key={idx} className={s.card}>
                  <div className={s.row}>
                    <label className={s.label}>{S.company_label}</label>
                    <input
                      className={s.input}
                      type="text"
                      placeholder={S.company_ph}
                      value={w.company || ""}
                      onChange={(e) =>
                        setParsed((prev) => {
                          const base = prev || emptyData;
                          const next = [...(base.work || [])];
                          next[idx] = { ...(next[idx] || {}), company: e.target.value };
                          return { ...base, work: next };
                        })
                      }
                      disabled={disableUI}
                    />
                  </div>

                  <div className={s.row}>
                    <label className={s.label}>{S.title_label}</label>
                    <input
                      className={s.input}
                      type="text"
                      placeholder={S.title_ph}
                      value={w.title || ""}
                      onChange={(e) =>
                        setParsed((prev) => {
                          const base = prev || emptyData;
                          const next = [...(base.work || [])];
                          next[idx] = { ...(next[idx] || {}), title: e.target.value };
                          return { ...base, work: next };
                        })
                      }
                      disabled={disableUI}
                    />
                  </div>

                  <div className={s.row}>
                    <label className={s.label}>{S.start_date}</label>
                    <input
                      className={s.input}
                      type="date"
                      value={w.startDate || ""}
                      onChange={(e) => handleDateChange("work", idx, "startDate", e.target.value)}
                      disabled={disableUI}
                    />
                  </div>

                  <div className={s.row}>
                    <label className={s.label}>{S.end_date}</label>
                    <div className={s.inputWrap}>
                      <input
                        className={`${s.input} ${w.current ? s.disabledField : ""}`}
                        type="date"
                        value={w.endDate || ""}
                        onChange={(e) => handleDateChange("work", idx, "endDate", e.target.value)}
                        disabled={disableUI || !!w.current}
                      />
                    </div>
                  </div>

                  <div className={s.row}>
                    <label className={s.label}></label>
                    <div className={s.radioRow}>
                      <label>
                        <input
                          type="checkbox"
                          checked={!!w.current}
                          onChange={(e) => handleCurrentChange("work", idx, e.target.checked)}
                          disabled={disableUI}
                        />{" "}
                        {S.currently_pursuing}
                      </label>
                    </div>
                  </div>

                  {dateErrs[`work_${idx}`] && (
                    <div className={s.row}>
                      <label className={s.label}></label>
                      <div className={s.errorText}>{dateErrs[`work_${idx}`]}</div>
                    </div>
                  )}

                  <div className={s.row}>
                    <label className={s.label}>{S.descriptions_label}</label>
                    <textarea
                      className={s.textarea}
                      rows={4}
                      placeholder={S.descriptions_ph}
                      value={(w.descriptions || []).join("\n")}
                      onChange={(e) =>
                        setParsed((prev) => {
                          const base = prev || emptyData;
                          const next = [...(base.work || [])];
                          next[idx] = {
                            ...(next[idx] || {}),
                            descriptions: e.target.value
                              .split("\n")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          };
                          return { ...base, work: next };
                        })
                      }
                      disabled={disableUI}
                    />
                  </div>

                  <div className={s.cardActions}>
                    <button type="button" className={s.buttonGhost} onClick={() => removeWork(idx)} disabled={disableUI}>
                      {S.remove}
                    </button>
                  </div>
                </div>
              ))}

              <div className={s.addRow}>
                <button type="button" className={s.buttonPrimary} onClick={addWork} disabled={disableUI}>
                  {S.add_work}
                </button>
              </div>
            </fieldset>

            {/* Skills (required) */}
            <fieldset className={s.section} disabled={disableUI} aria-busy={busyAttr}>
              <legend className={s.legend}>{S.skills_section}</legend>
              <div className={s.row}>
                <label className={s.label}>{S.skills_label}</label>
                <div>
                  <input
                    className={`${s.input} ${touched.skills && skillsInvalid ? s.invalid : ""}`}
                    type="text"
                    placeholder={S.skills_ph}
                    value={(p.skills || []).join(", ")}
                    onChange={(e) =>
                      setParsed((prev) => ({
                        ...(prev || emptyData),
                        skills: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      }))
                    }
                    onBlur={() => markTouched("skills")}
                    required
                    disabled={disableUI}
                  />
                  <div className={s.note}>{S.skills_note}</div>
                  {touched.skills && ((p.skills || []).join(", ").trim().length === 0) && (
                    <div className={s.errorText}>{S.skills_required}</div>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Self Voluntary */}
            <fieldset className={s.section} disabled={disableUI} aria-busy={busyAttr}>
              <legend className={s.legend}>{S.voluntary_section}</legend>

              <div className={s.row}>
                <label className={s.label}>{S.gender_label}</label>
                <select className={s.input} value={gender} onChange={(e) => setGender(e.target.value)} disabled={disableUI}>
                  <option value="">{S.gender_select}</option>
                  <option value="Male">{S.gender_male}</option>
                  <option value="Female">{S.gender_female}</option>
                  <option value="Other">{S.gender_other}</option>
                </select>
              </div>

              <div className={s.row}>
                <label className={s.label}>{S.disabled_q}</label>
                <div className={s.radioRow}>
                  <label>
                    <input
                      type="radio"
                      name="disabled"
                      value="No"
                      checked={!isDisabled}
                      onChange={() => setIsDisabled(false)}
                      disabled={disableUI}
                    />{" "}
                    {S.no}
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="disabled"
                      value="Yes"
                      checked={isDisabled}
                      onChange={() => setIsDisabled(true)}
                      disabled={disableUI}
                    />{" "}
                    {S.yes}
                  </label>
                </div>
              </div>

              {isDisabled && (
                <div className={s.row}>
                  <label className={s.label}>{S.accommodations_label}</label>
                  <textarea
                    className={s.textarea}
                    rows={3}
                    placeholder={S.accommodations_ph}
                    value={accommodations}
                    onChange={(e) => setAccommodations(e.target.value)}
                    disabled={disableUI}
                  />
                </div>
              )}
            </fieldset>

            {/* Final notes */}
            <fieldset className={s.section} disabled={disableUI} aria-busy={busyAttr}>
              <legend className={s.legend}>{S.final_section}</legend>
              <div className={s.row}>
                <label className={s.label}>{S.final_notes_label}</label>
                <textarea
                  className={`${s.textarea} ${touched.finalNotes && requiredInvalid(p.profile.summary) ? s.invalid : ""}`}
                  rows={4}
                  placeholder={S.final_notes_ph}
                  value={p.profile.summary}
                  onChange={(e) =>
                    setParsed((prev) => ({
                      ...(prev || emptyData),
                      profile: { ...(prev?.profile || emptyData.profile), summary: e.target.value },
                    }))
                  }
                  onBlur={() => markTouched("finalNotes")}
                  disabled={disableUI}
                />
              </div>
            </fieldset>

            <div className={s.submitRow}>
              <button type="button" className={s.buttonPrimary} disabled={disableUI}>
                {isLangLoading ? "…" : S.submit}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Images */}
        <aside className={s.right} aria-label="Visual guide">
          {images.map((src, i) => (
            <div className={s.rightCard} key={i}>
              <img className={s.preview} src={src} alt={`Guide ${i + 1}`} />
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function normalizeApilayerToForm(resp) {
  const name = resp?.name || "";
  const email = resp?.email || "";
  const skillsArray = Array.isArray(resp?.skills) ? resp.skills : [];

  const educationRaw = Array.isArray(resp?.education) ? resp.education : [];
  const education = educationRaw.map((e) =>
    typeof e === "string"
      ? { school: e, degree: "", grade: "", startDate: "", endDate: "", current: false, descriptions: [] }
      : {
          school: e?.name || e?.organization || e?.school || "",
          degree: e?.degree || "",
          grade: "",
          startDate: e?.date_start || "",
          endDate: e?.date_end || "",
          current: false,
          descriptions: e?.description ? [e.description] : [],
        }
  );

  const expRaw = Array.isArray(resp?.experience) ? resp.experience : [];
  const work = expRaw.map((x) => ({
    company: x?.organization || x?.company || "",
    title: x?.title || "",
    startDate: x?.date_start || "",
    endDate: x?.date_end || "",
    current: false,
    descriptions: [],
  }));

  return {
    profile: {
      name,
      email,
      phone: resp?.phone || "",
      location: resp?.address || resp?.location || "",
      links: [],
      summary: resp?.summary || "",
    },
    education,
    work,
    skills: skillsArray.filter(Boolean),
    total_experience: Number(resp?.total_experience || 0) || 0,
  };
}
