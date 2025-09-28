// src/pages/AppliedJobs.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "shepherd.js/dist/css/shepherd.css";
import Shepherd from "shepherd.js";
import s from "../styles/JobListings.module.css";
import { translateBatch } from "../lib/translateClient";

const HISTORY_API = (import.meta.env.VITE_API_BASE || "") + "/user/history";

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

  // Tour i18n
  tour_start_label: "Tour",
  tour_welcome_title: "Welcome",
  tour_welcome_desc: "A quick tour of applied jobs.",
  tour_step_info_title: "Summary",
  tour_step_info_desc: "This shows how many applied jobs are shown and total count.",
  tour_step_list_title: "Applied list",
  tour_step_list_desc: "Pick an applied job to view its details on the right.",
  tour_step_item_title: "A job item",
  tour_step_item_desc: "Each item shows title, company, location, and tags.",
  tour_step_details_title: "Details panel",
  tour_step_details_desc: "Full details for the selected applied job appear here.",
  tour_step_tags_title: "Tags",
  tour_step_tags_desc: "Employment type, seniority, salary range, and posted date.",
  tour_step_desc_title: "Description",
  tour_step_desc_desc: "First line of the description is shown here.",
  tour_step_skills_title: "Skills",
  tour_step_skills_desc: "Any parsed skills or requirements show up here.",
  tour_step_comp_title: "Compensation",
  tour_step_comp_desc: "Min/Max with currency and pay period when available.",
  tour_step_views_title: "Views",
  tour_step_views_desc: "View count for this job (if provided).",
  tour_step_withdraw_title: "Withdraw",
  tour_step_withdraw_desc: "Click to remove this job from the applied history.",
  tour_step_link_title: "External posting",
  tour_step_link_desc: "Open the original posting in a new tab.",
  tour_step_pagination_title: "Pagination",
  tour_step_pagination_desc: "Navigate across pages of applied jobs.",
  tour_done_title: "All set!",
  tour_done_desc: "Use the Tour button anytime for a refresher.",
};

function normalizeJob(doc, idx) {
  const row = doc || {};
  const idFromDoc =
    row._id && typeof row._id === "object" && row._id.$oid ? row._id.$oid : row._id;
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

  const pageSize = 100;

  const [allJobs, setAllJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  const [isMutating, setIsMutating] = useState(false);

  const lastQueryRef = useRef("");

  const [tCache, setTCache] = useState({});
  const cacheKey = (text) => `${lang}::${text}`;
  const t = (text) => {
    if (!text || typeof text !== "string") return text;
    const k = cacheKey(text);
    return tCache[k] ?? text;
  };

  // Shepherd tour instance
  const tourRef = useRef(null);

  // Helpers: auth header
  const getToken = () =>
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("access_token") ||
    "";

  const authHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Language listeners
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

  // Translate static UI labels (BASE)
  useEffect(() => {
    let active = true;
    const ctrl = new AbortController();
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

  // Shepherd theming utilities
  const styleOverlay = () => {
    const ov = document.querySelector(".shepherd-modal-overlay-container");
    if (ov) {
      ov.style.background = "rgba(15,23,42,.42)";
      ov.style.zIndex = "10020";
      ov.style.pointerEvents = "auto";
    }
  };
  const unstyleOverlay = () => {
    const ov = document.querySelector(".shepherd-modal-overlay-container");
    if (ov) {
      ov.style.background = "";
      ov.style.zIndex = "";
      ov.style.pointerEvents = "";
    }
  };
  const getAccent = () => {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
      return v || "#f97316";
    } catch {
      return "#f97316";
    }
  };
  const styleButtons = (container) => {
    const accent = getAccent();
    const btns = container.querySelectorAll(".shepherd-button");
    btns.forEach((b) => {
      b.style.display = "inline-flex";
      b.style.alignItems = "center";
      b.style.justifyContent = "center";
      b.style.gap = "6px";
      b.style.fontWeight = "700";
      b.style.borderRadius = "10px";
      b.style.padding = "8px 12px";
      b.style.border = "1px solid transparent";
      b.style.cursor = "pointer";
      b.style.transition =
        "background-color .18s ease, color .18s ease, border-color .18s ease, box-shadow .18s ease";
      b.style.minWidth = "72px";
      if (b.classList.contains("shepherd-button-primary")) {
        b.style.background = accent;
        b.style.color = "#fff";
        b.style.borderColor = accent;
        b.style.boxShadow = "0 3px 8px rgba(249,115,22,.25)";
      } else {
        b.classList.add("shepherd-button-secondary");
        b.style.background = "#fff";
        b.style.color = accent;
        b.style.borderColor = accent;
      }
    });
  };
  const getTargetEl = (step) => {
    const at = step?.options?.attachTo;
    const sel = (at && (typeof at === "string" ? at : at.element)) || null;
    if (!sel) return null;
    try {
      return document.querySelector(sel);
    } catch {
      return null;
    }
  };
  const addTargetOutline = (step) => {
    const el = getTargetEl(step);
    if (!el) return;
    el.dataset.prevOutline = el.style.outline || "";
    el.dataset.prevOutlineOffset = el.style.outlineOffset || "";
    el.dataset.prevBorderRadius = el.style.borderRadius || "";
    el.style.outlineOffset = "2px";
    el.style.borderRadius = "10px";
  };
  const removeTargetOutline = (step) => {
    const el = getTargetEl(step);
    if (!el) return;
    el.style.outline = el.dataset.prevOutline || "";
    el.style.outlineOffset = el.dataset.prevOutlineOffset || "";
    el.style.borderRadius = el.dataset.prevBorderRadius || "";
    delete el.dataset.prevOutline;
    delete el.dataset.prevOutlineOffset;
    delete el.dataset.prevBorderRadius;
  };
  const styleStepChrome = (step) => {
    const el = step.getElement?.();
    if (!el) return;
    el.style.borderRadius = "12px";
    el.style.border = "1px solid var(--ring)";
    el.style.boxShadow = "0 12px 24px rgba(15,23,42,.15)";
    el.style.color = "var(--ink)";
    el.style.background = "#fff";
    el.style.zIndex = "10030";
    el.style.maxWidth = "min(92vw, 420px)";
    el.style.pointerEvents = "auto";
    const header = el.querySelector(".shepherd-header");
    if (header) {
      header.style.background = "#fff";
      header.style.borderBottom = "1px solid var(--ring)";
      header.style.padding = "10px 12px";
    }
    const title = el.querySelector(".shepherd-title");
    if (title) {
      title.style.fontFamily =
        `'Khand', -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, sans-serif`;
      title.style.fontWeight = "900";
      title.style.color = "var(--ink)";
      title.style.fontSize = "16px";
    }
    const text = el.querySelector(".shepherd-text");
    if (text) {
      text.style.padding = "10px 12px";
      text.style.color = "black";
      text.style.lineHeight = "1.5";
    }
    const footer = el.querySelector(".shepherd-footer");
    if (footer) {
      footer.style.padding = "10px 12px 12px";
      footer.style.display = "flex";
      footer.style.gap = "8px";
      footer.style.justifyContent = "flex-end";
      footer.style.flexWrap = "wrap";
    }
    styleButtons(el);
    const cancel = el.querySelector(".shepherd-cancel-icon");
    if (cancel) {
      cancel.style.color = "var(--muted)";
      cancel.addEventListener(
        "mouseenter",
        () => {
          cancel.style.color = "var(--ink)";
        },
        { once: true }
      );
    }
    styleOverlay();
  };

  // Shepherd Tour
  const buildTour = () => {
    if (tourRef.current?.isActive?.()) {
      tourRef.current.cancel();
    }
    const buildFloatingUIMiddleware = () => {
      const m = [];
      const F = window?.FloatingUIDOM;
      if (F?.offset) m.push(F.offset({ mainAxis: 12, crossAxis: 0 }));
      if (F?.flip) m.push(F.flip());
      if (F?.shift) m.push(F.shift({ padding: 8 }));
      return m;
    };
    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        scrollTo: { behavior: "smooth", block: "center" },
        classes: "tour-step",
        floatingUIOptions: { middleware: buildFloatingUIMiddleware() },
        when: {
          show() {
            styleStepChrome(this);
            addTargetOutline(this);
          },
          hide() {
            removeTargetOutline(this);
          },
        },
      },
      useModalOverlay: true,
    });
    const defaultButtons = [
      { text: S.prev, action: tour.back, classes: "shepherd-button-secondary" },
      { text: S.next, action: tour.next, classes: "shepherd-button-primary" },
    ];
    tour.addStep({
      id: "welcome",
      title: S.tour_welcome_title,
      text: S.tour_welcome_desc,
      buttons: [
        { text: S.prev, action: tour.cancel, classes: "shepherd-button-secondary" },
        { text: S.next, action: tour.next, classes: "shepherd-button-primary" },
      ],
    });
    const steps = [
      {
        id: "info",
        attachTo: { element: ".aj-info", on: "bottom" },
        title: S.tour_step_info_title,
        text: S.tour_step_info_desc,
      },
      {
        id: "list",
        attachTo: { element: ".aj-list", on: "right" },
        title: S.tour_step_list_title,
        text: S.tour_step_list_desc,
      },
      {
        id: "item",
        attachTo: { element: ".aj-item", on: "right" },
        title: S.tour_step_item_title,
        text: S.tour_step_item_desc,
        canClickTarget: true,
      },
      {
        id: "details",
        attachTo: { element: ".aj-title", on: "bottom" },
        title: S.tour_step_details_title,
        text: S.tour_step_details_desc,
      },
      {
        id: "tags",
        attachTo: { element: ".aj-tags", on: "bottom" },
        title: S.tour_step_tags_title,
        text: S.tour_step_tags_desc,
      },
      {
        id: "desc",
        attachTo: { element: ".aj-desc", on: "top" },
        title: S.tour_step_desc_title,
        text: S.tour_step_desc_desc,
      },
      {
        id: "skills",
        attachTo: { element: ".aj-skills", on: "top" },
        title: S.tour_step_skills_title,
        text: S.tour_step_skills_desc,
      },
      {
        id: "comp",
        attachTo: { element: ".aj-comp", on: "top" },
        title: S.tour_step_comp_title,
        text: S.tour_step_comp_desc,
      },
      {
        id: "views",
        attachTo: { element: ".aj-views", on: "left" },
        title: S.tour_step_views_title,
        text: S.tour_step_views_desc,
      },
      {
        id: "withdraw",
        attachTo: { element: ".aj-withdrawBtn", on: "left" },
        title: S.tour_step_withdraw_title,
        text: S.tour_step_withdraw_desc,
        canClickTarget: true,
      },
      {
        id: "pagination",
        attachTo: { element: ".aj-pagination", on: "top" },
        title: S.tour_step_pagination_title,
        text: S.tour_step_pagination_desc,
        buttons: [
          { text: S.prev, action: tour.back, classes: "shepherd-button-secondary" },
          { text: S.next, action: tour.cancel, classes: "shepherd-button-primary" },
        ],
      },
      {
        id: "done",
        title: S.tour_done_title,
        text: S.tour_done_desc,
        buttons: [{ text: S.next, action: tour.cancel, classes: "shepherd-button-primary" }],
      },
    ].map((st) => {
      if (!st.buttons) st.buttons = defaultButtons;
      return st;
    });
    tour.addSteps(steps);
    tour.on("start", styleOverlay);
    tour.on("complete", unstyleOverlay);
    tour.on("cancel", unstyleOverlay);
    tourRef.current = tour;
  };

  const startTour = () => {
    buildTour();
    requestAnimationFrame(() => {
      tourRef.current?.start();
    });
  };

  // Fetch all applied jobs (history)
  async function fetchHistoryFromServer() {
    const res = await fetch(`${HISTORY_API}/`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error("Not authenticated");
      }
      throw new Error(`History API ${res.status}`);
    }
    const data = await res.json();
    const docs = Array.isArray(data) ? data : [];
    return docs.map((d, i) => normalizeJob(d, i));
  }

  // Client-side filter (case-insensitive)
  function filterJobs(jobs, queryString) {
    const terms = (queryString || "")
      .split(/[,\s]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (terms.length === 0) return jobs;
    return jobs.filter((j) => {
      const hay = [
        j.title,
        j.company,
        j.location,
        j.employmentType,
        j.seniority,
        j.description,
        j.skills,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return terms.every((term) => hay.includes(term));
    });
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
    setCurrentPage((p) => {
      const maxPage = Math.max(0, Math.ceil(jobs.length / pageSize) - 1);
      return Math.min(p, maxPage);
    });
    const first = jobs[0] || null;
    setSelected((sel) => {
      if (!sel) return first;
      const stillThere = jobs.find((j) => j.id === sel.id);
      return stillThere || first;
    });
  }

  function applyFilterAndPaginate(sourceJobs, query) {
    const jobs = filterJobs(sourceJobs, query);
    materializePages(jobs);
  }

  async function loadInitial(query) {
    setLoading(true);
    setLoadErr("");
    setPages({});
    setSelected(null);
    setTotal(0);
    try {
      const all = await fetchHistoryFromServer();
      setAllJobs(all);
      const qNow = (query || "").trim();
      applyFilterAndPaginate(all, qNow);
    } catch (e) {
      if (e && String(e.message || "").toLowerCase().includes("not authenticated")) {
        setLoadErr("Not authenticated");
      } else {
        setLoadErr(S.failed_load || "Failed to load job listings.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Load when query changes (refresh from server, then client-filter)
  useEffect(() => {
    const qNow = (q || "").trim();
    if (qNow === lastQueryRef.current) {
      if (allJobs.length && !qNow) {
        applyFilterAndPaginate(allJobs, qNow);
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
  const totalPages = useMemo(
    () => (total <= 0 ? 0 : Math.ceil(total / pageSize)),
    [total, pageSize]
  );
  const canPrev = currentPage > 0;
  const canNext = totalPages > 0 && currentPage < totalPages - 1;

  function formatMoney(n, curr) {
    if (n == null || n === "") return null;
    if (!curr) return String(n);
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: curr }).format(
        Number(n)
      );
    } catch {
      return `${curr} ${n}`;
    }
  }

  // Withdraw: DELETE /history/{job_id} then remove from state and re-paginate
  async function withdrawJob(job) {
    if (!job?.id) return;
    setIsMutating(true);
    setLoadErr("");
    try {
      const res = await fetch(`${HISTORY_API}/${encodeURIComponent(job.id)}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          ...authHeaders(),
        },
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Not authenticated");
        }
        throw new Error(`Delete failed ${res.status}`);
      }
      const updatedAll = allJobs.filter((j) => j.id !== job.id);
      setAllJobs(updatedAll);
      const qNow = (q || "").trim();
      applyFilterAndPaginate(updatedAll, qNow);
    } catch (e) {
      if (e && String(e.message || "").toLowerCase().includes("not authenticated")) {
        setLoadErr("Not authenticated");
      } else {
        setLoadErr("Failed to withdraw job.");
      }
    } finally {
      setIsMutating(false);
    }
  }

  // Translate dynamic page content (batch + de-dup), with deep extraction
  useEffect(() => {
    let active = true;
    const ctrl = new AbortController();

    const texts = [];
    const seen = new Set();
    const push = (v) => {
      if (!v || typeof v !== "string") return;
      const trimmed = v.trim();
      if (!trimmed || trimmed.length < 2) return;
      const k = cacheKey(trimmed);
      if (tCache[k]) return;
      if (!seen.has(trimmed)) {
        seen.add(trimmed);
        texts.push(trimmed);
      }
    };

    // Visible list items
    for (const j of currentItems) {
      push(j.title);
      push(j.company);
      push(j.location);
      push(j.employmentType);
      push(j.seniority);
      push(j.description);
      push(j.skills);
      push(j.posted);
      if (typeof j.salaryMin === "string") push(j.salaryMin);
      if (typeof j.salaryMax === "string") push(j.salaryMax);
      if (j.raw) {
        const extractAllStrings = (obj, maxDepth = 3, depth = 0) => {
          if (!obj || typeof obj !== "object" || depth >= maxDepth) return;
          for (const [key, val] of Object.entries(obj)) {
            if (typeof val === "string" && val.trim().length > 1) {
              const lowerKey = key.toLowerCase();
              const tv = val.trim();
              if (
                !lowerKey.includes("id") &&
                !lowerKey.includes("url") &&
                !lowerKey.includes("email") &&
                !lowerKey.includes("phone") &&
                !lowerKey.includes("currency") &&
                !/^\d+(\.\d+)?$/.test(tv) &&
                !/^https?:\/\//.test(tv) &&
                !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(tv)
              ) {
                push(val);
              }
            } else if (typeof val === "object" && val !== null) {
              extractAllStrings(val, maxDepth, depth + 1);
            }
          }
        };
        extractAllStrings(j.raw);
      }
    }

    // Selected job (deeper)
    if (selected) {
      push(selected.title);
      push(selected.company);
      push(selected.location);
      push(selected.employmentType);
      push(selected.seniority);
      push(selected.description);
      push(selected.skills);
      push(selected.posted);
      if (typeof selected.salaryMin === "string") push(selected.salaryMin);
      if (typeof selected.salaryMax === "string") push(selected.salaryMax);
      const rraw = selected.raw?.raw || {};
      push(rraw.skills_desc);
      push(rraw.pay_period);
      push(rraw.payPeriod);
      const extractAllStrings = (obj, maxDepth = 4, depth = 0) => {
        if (!obj || typeof obj !== "object" || depth >= maxDepth) return;
        for (const [key, val] of Object.entries(obj)) {
          if (typeof val === "string" && val.trim().length > 2) {
            const lowerKey = key.toLowerCase();
            const tv = val.trim();
            if (
              !lowerKey.includes("id") &&
              !lowerKey.includes("url") &&
              !lowerKey.includes("link") &&
              !lowerKey.includes("email") &&
              !lowerKey.includes("phone") &&
              !lowerKey.includes("currency") &&
              !lowerKey.includes("code") &&
              !/^\d+(\.\d+)?$/.test(tv) &&
              !/^https?:\/\//.test(tv) &&
              !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(tv) &&
              !/^\+?[\d\s\-\(\)]+$/.test(tv) &&
              !/^[A-Z]{3}$/.test(tv)
            ) {
              push(val);
            }
          } else if (typeof val === "object" && val !== null) {
            extractAllStrings(val, maxDepth, depth + 1);
          }
        }
      };
      if (selected.raw) extractAllStrings(selected.raw);
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
        // ignore dynamic translation failures
      }
    };

    run();
    return () => {
      active = false;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItems, selected, lang]);

  // Rebuild tour whenever localized strings change
  useEffect(() => {
    buildTour();
    return () => {
      if (tourRef.current?.isActive?.()) tourRef.current.cancel();
      tourRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [S]);

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
      {/* Tour dock */}
      <div className={s.tourDock} role="region" aria-label="Page help">
        <button
          type="button"
          className={s.tourBtn}
          onClick={startTour}
          aria-label={S.tour_start_label}
          title={S.tour_start_label}
        >
          <span className={s.tourIcon} aria-hidden="true">
            ❔
          </span>
          <span className={s.tourText}>{S.tour_start_label}</span>
        </button>
      </div>

      <aside className={s.left}>
        {loading && <div className={s.info}>{S.loading}</div>}
        {!loading && loadErr && <div className={s.hint}>{loadErr}</div>}

        {!loading && !loadErr && (
          <>
            <div className={`${s.info} aj-info`}>
              {`${S.showing_prefix} ${Math.min(
                total,
                pageSize * (currentPage + 1)
              )} ${S.of} ${total} ${S.jobs_word}`}
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

            <ul className={`${s.list} aj-list`} role="listbox" aria-label={S.list_aria}>
              {currentItemsT.length === 0 ? (
                <li className={s.hint}>{S.no_jobs_page}</li>
              ) : (
                currentItemsT.map((j) => (
                  <li
                    key={j.id}
                    className={`${s.item} aj-item ${selected?.id === j.id ? s.active : ""}`}
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
              <nav className={`${s.pageFooter} aj-pagination`} aria-label={S.pagination_aria}>
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
                <h2 className={`${s.title} aj-title`}>{selectedT.title || S.untitled_job}</h2>
                <div className={s.meta}>
                  <span className={s.company}>{selectedT.company || S.unknown_company}</span>
                  {selectedT.location && <span className={s.dot}>•</span>}
                  {selectedT.location && <span>{selectedT.location}</span>}
                </div>
                <div className={`${s.tags} aj-tags`}>
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
                {views != null && <span className={`${s.viewsChip} aj-views`}>👁 {views.toLocaleString()}</span>}
                <button
                  type="button"
                  className={`${s.btn} ${s.btnDanger} aj-withdrawBtn`}
                  onClick={() => withdrawJob(selectedT)}
                  disabled={isMutating}
                  title={S.withdraw_title}
                >
                  {S.withdraw}
                </button>
              </div>
            </header>

            {briefDesc && (
              <section className={s.section}>
                <h3 className={s.secHead}>{S.description}</h3>
                <p className={`${s.desc} aj-desc`}>{briefDesc}</p>
              </section>
            )}

            {selected?.raw?.raw?.skills_desc && (
              <section className={`${s.section} aj-skills`}>
                <h3 className={s.secHead}>{S.skills}</h3>
                <p className={s.desc}>{t(selected.raw.raw.skills_desc)}</p>
              </section>
            )}

            {hasRange && (
              <section className={`${s.section} aj-comp`}>
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
                <a
                  className={`${s.link} aj-applyLink`}
                  href={selectedT.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {S.view_posting}
                </a>
              </section>
            )}
          </article>
        )}
      </main>
    </div>
  );

  // Local helper (kept at bottom)
  function buildPageWindow(total, current, delta = 2) {
    const set = new Set([0, total - 1]);
    const start = Math.max(0, current - delta);
    const end = Math.min(total - 1, current + delta);
    for (let i = start; i <= end; i++) set.add(i);
    return Array.from(set).sort((a, b) => a - b);
  }
}
