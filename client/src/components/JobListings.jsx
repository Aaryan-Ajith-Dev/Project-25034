// src/pages/JobListings.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import s from "../styles/JobListings.module.css";

const API_BASE = import.meta.env.VITE_JOBS_API || "/api/jobs";
const RECS_API = import.meta.env.VITE_RECS_API || "/api/recommendations/jobs";
const CANDIDATE_ID = import.meta.env.VITE_CANDIDATE_ID || "";

// Normalize one MongoDB document into UI-friendly job object
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

// Tiny, accessible switch styled by CSS module
function TinySwitch({ checked, onChange, label }) {
  const toggle = () => onChange(!checked);
  const onKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle();
    }
  };
  return (
    <div className={s.switchRow}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={s.switchBtn}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <span className={s.switchTrack}>
          <span aria-hidden="true" className={s.switchThumb} />
        </span>
      </button>
      <span className={s.switchText}>{label}</span>
    </div>
  );
}

export default function JobListings() {
  // Input vs submitted query
  const [inputQ, setInputQ] = useState("");
  const [q, setQ] = useState("");

  // Recommendations mode (top 5)
  const [topOnly, setTopOnly] = useState(true);

  // Paging configuration
  const pageSizeBase = 200;
  const fetchBatchBase = 500;
  const prefetchAhead = 2;

  // Derived sizes
  const pageSize = topOnly ? 5 : pageSizeBase;
  const fetchBatch = topOnly ? 5 : fetchBatchBase;

  // Data state
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState({});
  const [loadedBatches, setLoadedBatches] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  const abortRef = useRef(null);
  const lastQueryRef = useRef("");

  // Total pages
  const totalPages = useMemo(() => {
    if (total <= 0) return 0;
    return Math.ceil(total / pageSize);
  }, [total, pageSize]);

  async function fetchBatchFromServer(skip, limit, query) {
    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("skip", String(skip));
    if (query && query.trim()) params.set("q", query.trim());

    const url = `${API_BASE}?${params.toString()}`;
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    const docs = Array.isArray(data?.jobs) ? data.jobs : Array.isArray(data) ? data : [];
    const normalized = docs.map((d, i) => normalizeJob(d, skip + i));
    return { jobs: normalized, total: Number(data?.total || 0) };
  }

  async function fetchTopRecommendations(query) {
    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams();
    params.set("limit", "5");
    if (CANDIDATE_ID) params.set("candidateId", CANDIDATE_ID);
    if ((query || "").trim()) params.set("q", (query || "").trim());

    const url = `${RECS_API}?${params.toString()}`;
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    const docs = Array.isArray(data?.jobs) ? data.jobs : Array.isArray(data) ? data : [];
    const normalized = docs.map((d, i) => normalizeJob(d, i));
    return { jobs: normalized, total: Math.min(5, normalized.length || Number(data?.total || 5)) };
  }

  function placeBatchIntoPages(batchSkip, batchJobs) {
    if (batchJobs.length === 0) return;
    setPages((prev) => {
      const next = { ...prev };
      for (let i = 0; i < batchJobs.length; i++) {
        const absoluteIndex = batchSkip + i;
        const pageIndex = Math.floor(absoluteIndex / pageSize);
        if (!next[pageIndex]) next[pageIndex] = [];
        next[pageIndex].push(batchJobs[i]);
      }
      Object.keys(next).forEach((k) => {
        next[k] = next[k].sort((a, b) => String(a.id).localeCompare(String(b.id)));
      });
      return next;
    });
  }

  async function loadInitial(query, useTop) {
    setLoading(true);
    setLoadErr("");
    setPages({});
    setLoadedBatches(new Set());
    setCurrentPage(0);
    setSelected(null);
    setTotal(0);
    if (abortRef.current) abortRef.current.abort();

    try {
      if (useTop) {
        const { jobs, total: t } = await fetchTopRecommendations(query);
        setTotal(Math.min(5, t || jobs.length || 0));
        placeBatchIntoPages(0, jobs.slice(0, 5));
        setLoadedBatches(new Set([0]));
        setSelected(jobs[0] || null);
      } else {
        const { jobs, total: t } = await fetchBatchFromServer(0, fetchBatch, query);
        setTotal(t);
        placeBatchIntoPages(0, jobs);
        setLoadedBatches(new Set([0]));
        setSelected((jobs && jobs[0]) || null);
      }
    } catch (e) {
      setLoadErr("Failed to load job listings.");
    } finally {
      setLoading(false);
    }
  }

  // Prefetch around visible page (skip in recommendations mode)
  async function prefetchAround(pageIndex, query) {
    if (topOnly) return;
    if (total <= 0) return;
    const startAbs = pageIndex * pageSize;
    const baseSkip = startAbs - (startAbs % fetchBatch);
    const toFetch = [];

    for (let i = 0; i <= prefetchAhead; i++) {
      const skipFwd = baseSkip + i * fetchBatch;
      if (skipFwd < total && !loadedBatches.has(skipFwd)) toFetch.push(skipFwd);
    }
    const skipBack = baseSkip - fetchBatch;
    if (skipBack >= 0 && !loadedBatches.has(skipBack)) toFetch.push(skipBack);

    for (const skip of toFetch) {
      try {
        const { jobs } = await fetchBatchFromServer(skip, fetchBatch, query);
        placeBatchIntoPages(skip, jobs);
        setLoadedBatches((prev) => new Set(prev).add(skip));
        await new Promise((r) => setTimeout(r, 50));
      } catch {
        // ignore prefetch errors
      }
    }
  }

  // Load on submitted query or toggle changes
  useEffect(() => {
    const qNow = (q || "").trim();
    if (qNow === lastQueryRef.current && !topOnly) return;
    const t = setTimeout(() => {
      lastQueryRef.current = qNow;
      loadInitial(qNow, topOnly);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, topOnly]);

  // Prefetch when navigating pages (not in recommendations mode)
  useEffect(() => {
    if (!topOnly && total > 0) {
      prefetchAround(currentPage, lastQueryRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, total, topOnly]);

  const currentItems = useMemo(() => pages[currentPage] || [], [pages, currentPage]);
  const canPrev = !topOnly && currentPage > 0;
  const canNext = !topOnly && totalPages > 0 && currentPage < totalPages - 1;

  return (
    <div className={s.wrap}>
      <aside className={s.left}>
        {/* Stacked: search on top, switch directly below left-aligned */}
        <div className={`${s.toolbar} ${s.toolbarStack}`}>
          <div className={s.searchWrap}>
            <input
              className={s.search}
              type="search"
              placeholder="Search jobs by title, company, location"
              value={inputQ}
              onChange={(e) => setInputQ(e.target.value)}
              aria-label="Job Search"
            />
            <button
              className={s.iconBtn}
              onClick={() => setQ((inputQ || "").trim())}
              aria-label="Submit Job Search"
              title="Search"
            >
              <img src="/search.png" alt="" className={s.icon} />
            </button>
          </div>

          <TinySwitch
            checked={topOnly}
            onChange={(enabled) => setTopOnly(enabled)}
            label="Top matches (5)"
          />
        </div>

        {loading && <div className={s.info}>Loading...</div>}
        {!loading && loadErr && <div className={s.hint}>{loadErr}</div>}

        {!loading && !loadErr && (
          <>
            <div className={s.info}>
              {topOnly
                ? `Top matches • ${Math.min(total || 0, 5)} jobs`
                : `Showing page ${currentPage + 1} of ${Math.max(totalPages, 1)} • ${total} jobs`}
            </div>

            <div className={s.toolbar} style={{ borderBottom: "none", paddingTop: 0 }}>
              <button
                className={s.uploadBtn}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                disabled={!canPrev}
                aria-disabled={!canPrev}
              >
                Prev
              </button>
              <button
                className={s.uploadBtn}
                onClick={() => setCurrentPage((p) => (canNext ? p + 1 : p))}
                disabled={!canNext}
                aria-disabled={!canNext}
              >
                Next
              </button>
              <button
                className={s.uploadBtn}
                onClick={() => {
                  if (!canNext) return;
                  const nextPageIndex = currentPage + 1;
                  const nextItems = pages[nextPageIndex] || [];
                  if (nextItems.length) {
                    setPages((prev) => {
                      const merged = { ...prev };
                      merged[currentPage] = [...(merged[currentPage] || []), ...nextItems];
                      return merged;
                    });
                    prefetchAround(nextPageIndex + 1, lastQueryRef.current);
                  } else {
                    prefetchAround(nextPageIndex, lastQueryRef.current);
                  }
                }}
                disabled={!canNext}
                aria-disabled={!canNext}
              >
                Load more
              </button>
            </div>

            <ul className={s.list} role="listbox" aria-label="Job Listings">
              {currentItems.length === 0 ? (
                <li className={s.hint}>No jobs in this page yet…</li>
              ) : (
                currentItems.map((j) => (
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
                    <div className={s.itemTitle}>{j.title || "Untitled Job"}</div>
                    <div className={s.itemMeta}>
                      {j.company || "Unknown company"} {j.location ? ` • ${j.location}` : ""}
                    </div>
                    {j.employmentType && <div className={s.badge}>{j.employmentType}</div>}
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </aside>

      <main className={s.right} aria-live="polite">
        {!selected && <div className={s.placeholder}>Select a job from the list to see details.</div>}
        {selected && (
          <article className={s.card}>
            <header className={s.header}>
              <h2 className={s.title}>{selected.title || "Untitled Job"}</h2>
              <div className={s.meta}>
                <span className={s.company}>{selected.company || "Unknown company"}</span>
                {selected.location && <span className={s.dot}>•</span>}
                {selected.location && <span>{selected.location}</span>}
              </div>
              <div className={s.tags}>
                {selected.employmentType && <span className={s.tag}>{selected.employmentType}</span>}
                {selected.seniority && <span className={s.tag}>{selected.seniority}</span>}
                {(selected.salaryMin || selected.salaryMax) && (
                  <span className={s.tag}>
                    {selected.currency ? `${selected.currency} ` : ""}
                    {selected.salaryMin || "—"} {selected.salaryMax ? `– ${selected.salaryMax}` : ""}
                  </span>
                )}
                {selected.posted && <span className={s.tag}>Posted: {selected.posted}</span>}
              </div>
            </header>

            {selected.description && (
              <section className={s.section}>
                <h3 className={s.secHead}>Description</h3>
                <p className={s.desc}>{selected.description}</p>
              </section>
            )}

            {selected.skills && (
              <section className={s.section}>
                <h3 className={s.secHead}>Skills</h3>
                <p className={s.desc}>{selected.skills}</p>
              </section>
            )}

            {selected.url && (
              <section className={s.section}>
                <h3 className={s.secHead}>Application</h3>
                <a className={s.link} href={selected.url} target="_blank" rel="noopener noreferrer">
                  View Job Posting
                </a>
              </section>
            )}

            <section className={s.section}>
              <h3 className={s.secHead}>Raw Data</h3>
              <div className={s.kvWrap}>
                {Object.entries(selected.raw || {}).slice(0, 30).map(([k, v]) => (
                  <React.Fragment key={k}>
                    <div className={s.k}>{k}</div>
                    <div className={s.v}>{typeof v === "object" ? JSON.stringify(v) : String(v)}</div>
                  </React.Fragment>
                ))}
              </div>
            </section>
          </article>
        )}
      </main>
    </div>
  );
}
