// src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import nav from "../styles/Navbar.module.css";
import {
  HomeIcon,
  BookOpenIcon,
  PhotoIcon,
  CheckBadgeIcon,
  DevicePhoneMobileIcon,
  LifebuoyIcon,
  BookmarkIcon,
  ArrowTrendingUpIcon,
  UserPlusIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";

// Language options (Google uses ISO 639-1 codes; region tags like zh-CN also work)
const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "mr", label: "मराठी" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ml", label: "മലയാളം" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
  { code: "or", label: "ଓଡ଼ିଆ" },
  { code: "ur", label: "اردو" }
];

const NAV_BASE = {
  home: "HOME",
  guidelines: "GUIDELINES/DOCUMENTATIONS",
  gallery: "GALLERY",
  eligibility: "ELIGIBILITY",
  mobile_app: "MOBILE APP",
  support: "SUPPORT",
  compendium: "COMPENDIUM",
  careers: "CAREERS",
  job_listings: "Job Listings",
  applied_jobs: "Applied Jobs",
  update_prefs: "Update Preferences",
  menu: "Menu",
  youth_reg: "Youth Registration",
  login: "Login",
  language: "Language"
};

// Optional persistent cache (per language) to avoid re-translation across reloads
const STORAGE_KEY_PREFIX = "navbar.i18n.v1";

// Calls backend proxy that wraps Google Cloud Translation v3 translateText.
// Response must be an array of translated strings in the same order as input.
async function translateBatch({ src, tgt, texts, signal }) {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ src, tgt, texts }),
    signal
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Translate failed: ${res.status} ${msg}`);
  }
  const data = await res.json();
  if (!Array.isArray(data?.translations)) {
    throw new Error("Invalid translate response");
  }
  return data.translations;
}

// Language dropdown similar to Careers
function LangDropdown({
  currentLang,
  setCurrentLang,
  isLangLoading,
  open,
  setOpen,
  triggerRef,
  menuRef
}) {
  const menuId = "lang-menu";

  function onTriggerKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((v) => !v);
    }
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => {
        const first = menuRef.current?.querySelector("li[tabindex]");
        first?.focus();
      });
    }
  }

  function onItemKeyDown(e, idx) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const items = Array.from(menuRef.current?.querySelectorAll("li[tabindex]") || []);
      items[(idx + 1) % items.length]?.focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const items = Array.from(menuRef.current?.querySelectorAll("li[tabindex]") || []);
      items[(idx - 1 + items.length) % items.length]?.focus();
    }
    if (e.key === "Home") {
      e.preventDefault();
      const items = Array.from(menuRef.current?.querySelectorAll("li[tabindex]") || []);
      items[0]?.focus();
    }
    if (e.key === "End") {
      e.preventDefault();
      const items = Array.from(menuRef.current?.querySelectorAll("li[tabindex]") || []);
      items[items.length - 1]?.focus();
    }
  }

  const curLabel = LANGS.find((l) => l.code === currentLang)?.label || currentLang;

  return (
    <div className={`${nav.dropdownContainer} ${open ? nav.dropdownOpen : ""}`}>
      <button
        type="button"
        ref={triggerRef}
        className={`${nav.btnReset} ${nav.langBtn}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        aria-busy={isLangLoading ? "true" : "false"}
        title="Language"
      >
        <span className={nav.navLink}>
          <GlobeAltIcon className={`${nav.icon} ${nav.iconLg}`} aria-hidden="true" />
          <span className={`${nav.langLabel} ${nav.navText}`}>{curLabel}</span>
          <span className={nav.arrow}>▼</span>
        </span>
      </button>

      {open && (
        <ul
          id={menuId}
          className={`${nav.dropdownMenu} ${nav.alignRight} ${nav.extra}` }
          ref={menuRef}
          role="menu"
        >
          {LANGS.map((l, i) => (
            <li
              key={l.code}
              role="menuitem"
              tabIndex={0}
              aria-selected={l.code === currentLang}
              onClick={() => {
                setCurrentLang(l.code);
                setOpen(false);
                triggerRef.current?.focus();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setCurrentLang(l.code);
                  setOpen(false);
                  triggerRef.current?.focus();
                } else {
                  onItemKeyDown(e, i);
                }
              }}
            >
              {l.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Navbar() {
  const [currentLang, setCurrentLang] = useState(() => localStorage.getItem("lang") || "en");
  const [T, setT] = useState(NAV_BASE);
  const [isLangLoading, setIsLangLoading] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false); // Careers
  const [langOpen, setLangOpen] = useState(false); // Language
  const [mobileOpen, setMobileOpen] = useState(false);

  const dropdownRef = useRef(null); // Careers menu UL
  const itemRef = useRef(null);     // Careers trigger

  const langMenuRef = useRef(null);   // Language menu UL
  const langItemRef = useRef(null);   // Language trigger

  const navigate = useNavigate();
  const location = useLocation();

  // Persist user language preference and broadcast to app
  useEffect(() => {
    localStorage.setItem("lang", currentLang);
    window.dispatchEvent(new CustomEvent("app:lang", { detail: { code: currentLang } }));
  }, [currentLang]);

  // Translate navbar labels with Cloud Translation via backend proxy
  useEffect(() => {
    let active = true;
    const ctrl = new AbortController();

    if (currentLang === "en") {
      setT(NAV_BASE);
      return () => ctrl.abort();
    }

    setIsLangLoading(true);

    const keysSorted = Object.keys(NAV_BASE).sort();
    const texts = keysSorted.map((k) => NAV_BASE[k]);
    const storageKey = `${STORAGE_KEY_PREFIX}:${currentLang}`;

    try {
      const cached = sessionStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") {
          setT(parsed);
          setIsLangLoading(false);
          return () => ctrl.abort();
        }
      }
    } catch {}

    (async () => {
      try {
        const translations = await translateBatch({
          src: "en",
          tgt: currentLang,
          texts,
          signal: ctrl.signal
        });

        if (!active) return;

        const out = {};
        for (let i = 0; i < keysSorted.length; i++) {
          const key = keysSorted[i];
          out[key] = translations[i] || NAV_BASE[key];
        }

        setT(out);

        try {
          sessionStorage.setItem(storageKey, JSON.stringify(out));
        } catch {}
      } catch (err) {
        if (err?.name !== "AbortError") {
          setT(NAV_BASE);
        }
      } finally {
        if (active) setIsLangLoading(false);
      }
    })();

    return () => {
      active = false;
      ctrl.abort();
    };
  }, [currentLang]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      const t = event.target;
      const clickedCareers =
        itemRef.current?.contains(t) || dropdownRef.current?.contains(t);
      const clickedLang =
        langItemRef.current?.contains(t) || langMenuRef.current?.contains(t);

      if (dropdownOpen && !clickedCareers) setDropdownOpen(false);
      if (langOpen && !clickedLang) setLangOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen, langOpen]);

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        setMobileOpen(false);
        setLangOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setDropdownOpen(false);
    setMobileOpen(false);
    setLangOpen(false);
  }, [location.pathname]);

  return (
    <header className={nav.headerWrap}>
      <div className={nav.navUpper}>
        <div className={nav.headerInner}>
          <div className={nav.logos}>
            <img src="/MCA.svg" alt="MCA" className={nav.logo} />
            <img src="/pm_internship_logo_eng.svg" alt="PM Internship" className={nav.logo} />
          </div>

          <div className={nav.ctaRow}>
            {/* Language dropdown trigger (black button, white text/icon) */}
            <LangDropdown
              currentLang={currentLang}
              setCurrentLang={setCurrentLang}
              isLangLoading={isLangLoading}
              open={langOpen}
              setOpen={setLangOpen}
              triggerRef={langItemRef}
              menuRef={langMenuRef}
            />

            <button
              type="button"
              className={`${nav.ctaBtn} ${nav.ctaPrimary}`}
              onClick={(e) => e.preventDefault()}
              aria-label={T.youth_reg}
              title={T.youth_reg}
            >
              <UserPlusIcon className={nav.ctaIcon} aria-hidden="true" />
              <span className={nav.ctaText}>{T.youth_reg}</span>
            </button>
            <button
              type="button"
              className={`${nav.ctaBtn} ${nav.ctaPrimary}`}
              onClick={(e) => e.preventDefault()}
              aria-label={T.login}
              title={T.login}
            >
              <ArrowRightOnRectangleIcon className={nav.ctaIcon} aria-hidden="true" />
              <span className={nav.ctaText}>{T.login}</span>
            </button>
          </div>
        </div>
      </div>

      <nav className={nav.navbar} role="navigation" aria-label="Primary">
        <div className={`${nav.navInner} ${mobileOpen ? nav.mobileOpen : ""}`}>
          <ul className={nav.navList}>
            <li>
              <span className={nav.navLink}>
                <HomeIcon className={nav.icon} aria-hidden="true" />
                <span className={nav.navText}>{T.home}</span>
              </span>
            </li>
            <li>
              <span className={nav.navLink}>
                <BookOpenIcon className={`${nav.icon} ${nav.iconLg}`} aria-hidden="true" />
                <span className={nav.navText}>{T.guidelines}</span>
              </span>
            </li>
            <li>
              <span className={nav.navLink}>
                <PhotoIcon className={nav.icon} aria-hidden="true" />
                <span className={nav.navText}>{T.gallery}</span>
              </span>
            </li>
            <li>
              <span className={nav.navLink}>
                <CheckBadgeIcon className={nav.icon} aria-hidden="true" />
                <span className={nav.navText}>{T.eligibility}</span>
              </span>
            </li>
            <li>
              <span className={nav.navLink}>
                <DevicePhoneMobileIcon className={nav.icon} aria-hidden="true" />
                <span className={nav.navText}>{T.mobile_app}</span>
              </span>
            </li>
            <li>
              <span className={nav.navLink}>
                <LifebuoyIcon className={nav.icon} aria-hidden="true" />
                <span className={nav.navText}>{T.support}</span>
              </span>
            </li>
            <li>
              <span className={nav.navLink}>
                <BookmarkIcon className={nav.icon} aria-hidden="true" />
                <span className={nav.navText}>{T.compendium}</span>
              </span>
            </li>

            <li
              className={`${nav.dropdownContainer} ${dropdownOpen ? nav.dropdownOpen : ""}`}
              ref={itemRef}
              tabIndex={0}
              onClick={() => setDropdownOpen((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setDropdownOpen((v) => !v);
                if (e.key === "Escape") setDropdownOpen(false);
              }}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              <ArrowTrendingUpIcon className={`${nav.icon} ${nav.iconLg}`} aria-hidden="true" />
              <div className={`${nav.careersLabel} ${nav.navText}`}>{T.careers}</div> <span className={nav.arrow}>▼</span>
              {dropdownOpen && (
                <ul className={`${nav.dropdownMenu} ${nav.alignRight}`} ref={dropdownRef}>
                  <li
                    tabIndex={0}
                    onClick={() => navigate("/job-listings")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") navigate("/job-listings");
                    }}
                  >
                    {T.job_listings}
                  </li>
                  <li tabIndex={-1}>{T.applied_jobs}</li>
                  <li tabIndex={-1}>
                    <Link to="/" style={{ color: "black", textDecoration: "none" }}>
                      {T.update_prefs}
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          </ul>

          <button
            type="button"
            className={nav.menuBtn}
            aria-controls="primary-mobile"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            title={T.menu}
          >
            {mobileOpen ? (
              <XMarkIcon className={nav.menuIcon} aria-hidden="true" />
            ) : (
              <Bars3Icon className={nav.menuIcon} aria-hidden="true" />
            )}
            <span className={nav.menuLabel}>{T.menu}</span>
          </button>

          <div id="primary-mobile" className={nav.mobilePanel}>
            <ul className={nav.mobileList}>
              <li className={nav.mobileItem}>
                <span className={nav.navLink}>
                  <HomeIcon className={nav.icon} aria-hidden="true" />
                  <span className={nav.navText}>{T.home}</span>
                </span>
              </li>
              <li className={nav.mobileItem}>
                <span className={nav.navLink}>
                  <BookOpenIcon className={`${nav.icon} ${nav.iconLg}`} aria-hidden="true" />
                  <span className={nav.navText}>{T.guidelines}</span>
                </span>
              </li>
              <li className={nav.mobileItem}>
                <span className={nav.navLink}>
                  <PhotoIcon className={nav.icon} aria-hidden="true" />
                  <span className={nav.navText}>{T.gallery}</span>
                </span>
              </li>
              <li className={nav.mobileItem}>
                <span className={nav.navLink}>
                  <CheckBadgeIcon className={nav.icon} aria-hidden="true" />
                  <span className={nav.navText}>{T.eligibility}</span>
                </span>
              </li>
              <li className={nav.mobileItem}>
                <span className={nav.navLink}>
                  <DevicePhoneMobileIcon className={nav.icon} aria-hidden="true" />
                  <span className={nav.navText}>{T.mobile_app}</span>
                </span>
              </li>
              <li className={nav.mobileItem}>
                <span className={nav.navLink}>
                  <LifebuoyIcon className={nav.icon} aria-hidden="true" />
                  <span className={nav.navText}>{T.support}</span>
                </span>
              </li>
              <li className={nav.mobileItem}>
                <span className={nav.navLink}>
                  <BookmarkIcon className={nav.icon} aria-hidden="true" />
                  <span className={nav.navText}>{T.compendium}</span>
                </span>
              </li>

              <li className={nav.mobileGroupHead}>{T.careers}</li>
              <li
                className={nav.mobileSubItem}
                onClick={() => {
                  setMobileOpen(false);
                  navigate("/job-listings");
                }}
              >
                {T.job_listings}
              </li>
              <li className={nav.mobileSubItem}>{T.applied_jobs}</li>
              <li className={nav.mobileSubItem}>
                <Link to="/" style={{ color: "white", textDecoration: "none" }} onClick={() => setMobileOpen(false)}>
                  {T.update_prefs}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
