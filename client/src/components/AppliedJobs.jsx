// src/pages/AppliedJobs.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import s from "../styles/JobListings.module.css";
import { translateBatch } from "../lib/translateClient";

const APPLIED_API = (import.meta.env.VITE_API_BASE || "") + "/applied";

const BASE = {
  search_ph: "Search jobs by title, company, location",
  search_title: "Search",
  search_aria: "Job Search",
  submit_search_aria: "Submit Job Search",
  jobs_word: "jobs",
  loading: "Loading...",
  failed_load: "Failed to load job listings.",
  showing_prefix: "Showing",
  of: "of",
  prev: "Prev",
  next: "Next",
  no_jobs_page: "No jobs in this page yet…",
  list_aria: "Job Listings",
  pagination_aria: "Pagination",
  page_word: "Page",
  select_placeholder: "Select a job from the list to see details.",
  untitled_job: "Untitled Job",
  unknown_company: "Unknown company",
  description: "Description",
  skills: "Skills",
  compensation: "Compensation",
  posted_label: "Posted:",
  application: "Application",
  view_posting: "View Job Posting",
  apply: "Apply",
  withdraw: "Withdraw",
  withdraw_title: "Withdraw application",
  apply_title: "Apply to this job",
  per: "per",
};

function normalizeJob(doc, idx) {
  const row = doc || {};
  const idFromDoc = row._id && typeof row._id === "object" && row._id.$oid ? row._id.$oid : row._id;
  const id = idFromDoc || row.id || `job-${idx}`;
  return {
    id: String(id || "").trim(),
    title: String(row.title || "").trim(),
    company: String(row.company || "").trim(),
    location: String(row.location || "").trim(),
    employmentType: String(row.employmentType || "").trim(),
    seniority: String(row.seniority || "").trim(),
    description: String(row.description || "").trim(),
    skills: String(row.skills || "").trim(),
    salaryMin: row.salaryMin ?? "",
    salaryMax: row.salaryMax ?? "",
    currency: String(row.currency || "").trim(),
    posted: String(row.posted || "").trim(),
    url: String(row.url || "").trim(),
    raw: row,
  };
}

export default function AppliedJobs() {
  const [S, setS] = useState(BASE);
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "en");
  const [isLangLoading, setIsLangLoading] = useState(false);

  const [inputQ, setInputQ] = useState("");
  const [q, setQ] = useState("");

  // Pagination always full-size
  const pageSize = 100;

  const [allJobs, setAllJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  const [appliedIds, setAppliedIds] = useState(() => {
    try {
      const raw = localStorage.getItem("appliedJobs") || "[]";
      const list = JSON.parse(raw);
      return new Set(Array.isArray(list) ? list : []);
    } catch {
      return new Set();
    }
  });

  const lastQueryRef = useRef("");

  const [tCache, setTCache] = useState({});
  const cacheKey = (text) => `${lang}::${text}`;
  const t = (text) => {
    if (!text || typeof text !== "string") return text;
    const k = cacheKey(text);
    return tCache[k] ?? text;
  };

  useEffect(() => {
    const onLang = (e) => {
      const l = (e?.detail && e.detail.code) || localStorage.getItem("lang") || "en";
      setLang(l);
    };
    window.addEventListener("app:lang", onLang);
    window.addEventListener("storage", onLang);
    return () => {
      window.removeEventListener("app:lang", onLang);
      window.removeEventListener("storage", onLang);
    };
  }, []);

  useEffect(() => {
    setTCache({});
  }, [lang]);

  useEffect(() => {
    let active = true;
    let ctrl = new AbortController();
    const doTranslate = async () => {
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
    doTranslate();
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [lang]);

  async function fetchAllFromServer() {
    const res = await fetch(`${APPLIED_API}/`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Applied API ${res.status}`);
    const data = await res.json();
    const docs = Array.isArray(data) ? data : [];
    return docs.map((d, i) => normalizeJob(d, i));
  }

  async function fetchFilteredBySearch(queryString) {
    const terms = (queryString || "")
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const params = new URLSearchParams();
    for (const t of terms) params.append("search", t);
    const url = `${APPLIED_API}/filter?${params.toString()}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Applied Filter API ${res.status}`);
    const data = await res.json();
    const docs = Array.isArray(data) ? data : [];
    return docs.map((d, i) => normalizeJob(d, i));
  }

  function materializePages(jobs) {
    const paged = {};
    for (let i = 0; i < jobs.length; i++) {
      const pageIndex = Math.floor(i / pageSize);
      if (!paged[pageIndex]) paged[pageIndex] = [];
      paged[pageIndex].push(jobs[i]);
    }
    setPages(paged);
    setTotal(jobs.length);
    setCurrentPage(0);
    setSelected(jobs[0] || null);
  }

  async function loadInitial(query) {
    setLoading(true);
    setLoadErr("");
    setPages({});
    setSelected(null);
    setTotal(0);
    try {
      let jobs = [];
      const qNow = (query || "").trim();
      if (qNow) {
        jobs = await fetchFilteredBySearch(qNow);
      } else {
        const all = await fetchAllFromServer();
        jobs = all;
        setAllJobs(all);
      }
      materializePages(jobs);
    } catch (e) {
      setLoadErr(S.failed_load || "Failed to load job listings.");
    } finally {
      setLoading(false);
    }
  }

  // Load when query changes
  useEffect(() => {
    const qNow = (q || "").trim();
    if (qNow === lastQueryRef.current) {
      if (allJobs.length && !qNow) {
        materializePages(allJobs);
        return;
      }
    }
    const tId = setTimeout(() => {
      lastQueryRef.current = qNow;
      loadInitial(qNow);
    }, 200);
    return () => clearTimeout(tId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, S.failed_load]);

  const currentItems = useMemo(() => pages[currentPage] || [], [pages, currentPage]);
  const totalPages = useMemo(() => (total <= 0 ? 0 : Math.ceil(total / pageSize)), [total, pageSize]);
  const canPrev = currentPage > 0;
  const canNext = totalPages > 0 && currentPage < totalPages - 1;

  function formatMoney(n, curr) {
    if (n == null || n === "") return null;
    if (!curr) return String(n);
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: curr }).format(Number(n));
    } catch {
      return `${curr} ${n}`;
    }
  }

  function toggleApply(job) {
    const next = new Set(appliedIds);
    if (next.has(job.id)) next.delete(job.id);
    else next.add(job.id);
    setAppliedIds(next);
    try {
      localStorage.setItem("appliedJobs", JSON.stringify(Array.from(next)));
    } catch {}
  }

  function buildPageWindow(total, current, delta = 2) {
    const set = new Set([0, total - 1]);
    const start = Math.max(0, current - delta);
    const end = Math.min(total - 1, current + delta);
    for (let i = start; i <= end; i++) set.add(i);
    return Array.from(set).sort((a, b) => a - b);
  }

  useEffect(() => {
    let active = true;
    let ctrl = new AbortController();

    const texts = [];
    const seen = new Set();
    const push = (v) => {
      if (!v || typeof v !== "string") return;
      const trimmed = v.trim();
      if (!trimmed) return;
      const k = cacheKey(trimmed);
      if (tCache[k]) return;
      if (!seen.has(trimmed)) {
        seen.add(trimmed);
        texts.push(trimmed);
      }
    };

    for (const j of currentItems) {
      push(j.title);
      push(j.company);
      push(j.location);
      push(j.employmentType);
      push(j.seniority);
      push(j.description);
      push(j.skills);
      push(j.posted);
    }

    if (selected) {
      push(selected.title);
      push(selected.company);
      push(selected.location);
      push(selected.employmentType);
      push(selected.seniority);
      push(selected.description);
      push(selected.skills);
      push(selected.posted);

      const rraw = selected.raw?.raw || {};
      push(rraw.skills_desc);
      push(rraw.pay_period);
      push(rraw.payPeriod);

      if (selected.raw) {
        const addFromObj = (obj) => {
          if (!obj || typeof obj !== "object") return;
          for (const val of Object.values(obj)) {
            if (typeof val === "string") {
              push(val);
            } else if (typeof val === "object" && val !== null) {
              addFromObj(val);
            }
          }
        };
        addFromObj(selected.raw);
      }
    }

    const run = async () => {
      if (lang === "en" || texts.length === 0) return;
      try {
        const out = await translateBatch({
          src: "en",
          tgt: lang,
          texts,
          signal: ctrl.signal,
        });
        if (!active) return;
        setTCache((prev) => {
          const next = { ...prev };
          for (let i = 0; i < texts.length; i++) {
            next[`${lang}::${texts[i]}`] = out[i] || texts[i];
          }
          return next;
        });
      } catch {
        // ignore translation failures
      }
    };

    run();
    return () => {
      active = false;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItems, selected, lang]);

  const currentItemsT = useMemo(() => {
    return currentItems.map((j) => ({
      ...j,
      title: t(j.title),
      company: t(j.company),
      location: t(j.location),
      employmentType: t(j.employmentType),
      seniority: t(j.seniority),
      description: t(j.description),
      skills: t(j.skills),
      posted: t(j.posted),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItems, tCache, lang]);

  const selectedT = useMemo(() => {
    if (!selected) return null;
    return {
      ...selected,
      title: t(selected.title),
      company: t(selected.company),
      location: t(selected.location),
      employmentType: t(selected.employmentType),
      seniority: t(selected.seniority),
      description: t(selected.description),
      skills: t(selected.skills),
      posted: t(selected.posted),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, tCache, lang]);

  const briefDesc = (selectedT?.description || "").split("\n")[0];

  const views = selected?.raw?.raw?.views;
  const rraw = selected?.raw?.raw || {};
  const min = rraw.min_salary ?? rraw.salaryMin ?? null;
  const max = rraw.max_salary ?? rraw.salaryMax ?? null;
  const curr = rraw.currency || rraw.salaryCurrency || null;
  const payPeriod = t(rraw.pay_period || rraw.payPeriod || "");

  const formattedMin = formatMoney(min, curr);
  const formattedMax = formatMoney(max, curr);
  const hasRange = min != null || max != null;

  return (
    <div className={s.wrap}>
      <aside className={s.left}>
        <div className={`${s.toolbar} ${s.toolbarStack}`}>
          <div className={s.searchWrap}>
            <input
              className={s.search}
              type="search"
              placeholder={S.search_ph}
              value={inputQ}
              onChange={(e) => setInputQ(e.target.value)}
              aria-label={S.search_aria}
            />
            <button
              className={s.iconBtn}
              onClick={() => setQ((inputQ || "").trim())}
              aria-label={S.submit_search_aria}
              title={S.search_title}
            >
              <img src="/search.png" alt="" className={s.icon} />
            </button>
          </div>
        </div>

        {loading && <div className={s.info}>{S.loading}</div>}
        {!loading && loadErr && <div className={s.hint}>{loadErr}</div>}

        {!loading && !loadErr && (
          <>
            <div className={s.info}>
              {`${S.showing_prefix} ${Math.min(total, pageSize * (currentPage + 1))} ${S.of} ${total} ${S.jobs_word}`}
            </div>

            <div className={s.toolbar} style={{ borderBottom: "none", paddingTop: 0 }}>
              <button
                className={`${s.btn} ${s.btnOutline}`}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                disabled={!canPrev}
                aria-disabled={!canPrev}
              >
                {S.prev}
              </button>
              <button
                className={`${s.btn} ${s.btnOutline}`}
                onClick={() => setCurrentPage((p) => (canNext ? p + 1 : p))}
                disabled={!canNext}
                aria-disabled={!canNext}
              >
                {S.next}
              </button>
            </div>

            <ul className={s.list} role="listbox" aria-label={S.list_aria}>
              {currentItemsT.length === 0 ? (
                <li className={s.hint}>{S.no_jobs_page}</li>
              ) : (
                currentItemsT.map((j) => (
                  <li
                    key={j.id}
                    className={`${s.item} ${selected?.id === j.id ? s.active : ""}`}
                    tabIndex={0}
                    role="option"
                    aria-selected={selected?.id === j.id}
                    onClick={() => setSelected(j)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelected(j);
                    }}
                  >
                    <div className={s.itemTitle}>{j.title || S.untitled_job}</div>
                    <div className={s.itemMeta}>
                      {j.company || S.unknown_company} {j.location ? ` • ${j.location}` : ""}
                    </div>
                    {j.employmentType && <div className={s.badge}>{j.employmentType}</div>}
                  </li>
                ))
              )}
            </ul>

            {totalPages > 1 && (
              <nav className={s.pageFooter} aria-label={S.pagination_aria}>
                {(() => {
                  const win = buildPageWindow(totalPages, currentPage, 2);
                  let last = null;
                  return win.map((p) => {
                    const gap = last !== null ? p - last : 0;
                    last = p;
                    return (
                      <React.Fragment key={`frag-${p}`}>
                        {gap > 1 && (
                          <span role="img" aria-label="ellipses" className={s.pageDots}>
                            …
                          </span>
                        )}
                        <button
                          className={`${s.pageBtn} ${p === currentPage ? s.pageBtnActive : ""}`}
                          onClick={() => setCurrentPage(p)}
                          aria-current={p === currentPage ? "page" : undefined}
                          aria-label={`${S.page_word} ${p + 1}`}
                        >
                          {p + 1}
                        </button>
                      </React.Fragment>
                    );
                  });
                })()}
              </nav>
            )}
          </>
        )}
      </aside>

      <main className={s.right} aria-live="polite">
        {!selectedT && <div className={s.placeholder}>{S.select_placeholder}</div>}
        {selectedT && (
          <article className={s.card}>
            <header className={`${s.header} ${s.headerRow}`}>
              <div className={s.headerMain}>
                <h2 className={s.title}>{selectedT.title || S.untitled_job}</h2>
                <div className={s.meta}>
                  <span className={s.company}>{selectedT.company || S.unknown_company}</span>
                  {selectedT.location && <span className={s.dot}>•</span>}
                  {selectedT.location && <span>{selectedT.location}</span>}
                </div>
                <div className={s.tags}>
                  {selectedT.employmentType && <span className={s.tag}>{selectedT.employmentType}</span>}
                  {selectedT.seniority && <span className={s.tag}>{selectedT.seniority}</span>}
                  {(selectedT.salaryMin || selectedT.salaryMax) && (
                    <span className={s.tag}>
                      {selectedT.currency ? `${selectedT.currency} ` : ""}
                      {selectedT.salaryMin || "—"} {selectedT.salaryMax ? `– ${selectedT.salaryMax}` : ""}
                    </span>
                  )}
                  {selectedT.posted && <span className={s.tag}>{`${S.posted_label} ${selectedT.posted}`}</span>}
                </div>
              </div>

              <div className={s.headerActions}>
                {views != null && <span className={s.viewsChip}>👁 {views.toLocaleString()}</span>}
                <button
                  type="button"
                  className={`${s.btn} ${appliedIds.has(selectedT.id) ? s.btnDanger : s.btnPrimary}`}
                  onClick={() => toggleApply(selectedT)}
                  title={appliedIds.has(selectedT.id) ? S.withdraw_title : S.apply_title}
                >
                  {appliedIds.has(selectedT.id) ? S.withdraw : S.apply}
                </button>
              </div>
            </header>

            {briefDesc && (
              <section className={s.section}>
                <h3 className={s.secHead}>{S.description}</h3>
                <p className={s.desc}>{briefDesc}</p>
              </section>
            )}

            {selected?.raw?.raw?.skills_desc && (
              <section className={s.section}>
                <h3 className={s.secHead}>{S.skills}</h3>
                <p className={s.desc}>{t(selected.raw.raw.skills_desc)}</p>
              </section>
            )}

            {hasRange && (
              <section className={s.section}>
                <h3 className={s.secHead}>{S.compensation}</h3>
                <p className={s.desc}>
                  {formattedMin ?? "—"}
                  {formattedMax ? ` – ${formattedMax}` : ""}
                  {payPeriod ? ` ${S.per} ${payPeriod.toLowerCase()}` : ""}
                </p>
              </section>
            )}

            {selectedT.url && (
              <section className={s.section}>
                <h3 className={s.secHead}>{S.application}</h3>
                <a className={s.link} href={selectedT.url} target="_blank" rel="noopener noreferrer">
                  {S.view_posting}
                </a>
              </section>
            )}
          </article>
        )}
      </main>
    </div>
  );
}
