import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import "./tool-header.css";

export type ToolId = "positions" | "talkingpoints" | "highlights" | "record" | "generator";

const tools: { id: ToolId; path: string; en: string; es: string }[] = [
  { id: "positions", path: "/cliposition/", en: "Positions", es: "Posiciones" },
  { id: "talkingpoints", path: "/talkingpoints/", en: "Talking points", es: "Puntos de conversación" },
  { id: "highlights", path: "/highlights/", en: "Highlights", es: "Highlights" },
  { id: "record", path: "/record/", en: "The record", es: "El historial" },
  { id: "generator", path: "/generator/", en: "Sign generator", es: "Generador de carteles" }
];

type Props = {
  current: ToolId;
  skipTo: string;
  locale?: "en" | "es";
  origin?: string;
  campaignUrl?: string;
  voteUrl?: string;
  volunteerUrl?: string;
  onLanguageChange?: () => void;
  onAction?: (action: string) => void;
  children?: ReactNode;
};

/** Canonical source: tools4abdul/cliposition, shared/tool-header. Bundled locally in each tool. */
export function ToolHeader({
  current, skipTo, locale = "en", origin = "https://tools4abdul.com",
  campaignUrl = "https://abdulforsenate.com/",
  voteUrl = "https://abdulforsenate.com/vote/",
  volunteerUrl = "https://abdulforsenate.com/volunteer-for-abdul/",
  onLanguageChange, onAction, children
}: Props) {
  const spanish = locale === "es";
  const base = origin.replace(/\/$/, "");
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const toolsRef = useRef<HTMLElement>(null);

  // On phones the tool pills scroll sideways; start with the current tool in view.
  useEffect(() => {
    const strip = toolsRef.current;
    const active = strip?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!strip || !active) return;
    const activeRight = active.getBoundingClientRect().right - strip.getBoundingClientRect().left;
    // 28px matches the strip's faded right edge in tool-header.css.
    if (activeRight > strip.clientWidth - 28) strip.scrollLeft += activeRight - strip.clientWidth + 28;
  }, []);

  // The phone menu closes on Escape (returning focus to its button) or an outside tap.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      toggleRef.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen]);

  const act = (action: string) => {
    setMenuOpen(false);
    onAction?.(action);
  };

  return <>
    <a className="t4a-skip" href={skipTo}>{spanish ? "Saltar al contenido" : "Skip to content"}</a>
    <header className="t4a-header" data-tool-header="1" data-menu-open={menuOpen || undefined} ref={headerRef}>
      <div className="t4a-top">
        <a className="t4a-brand" href={`${base}/cliposition/`} aria-label={spanish ? "Abdul for U.S. Senate, herramientas" : "Abdul for U.S. Senate tools, home"}>
          <b>ABDUL</b><small>FOR U.S. SENATE</small>
        </a>
        <nav className="t4a-utilities" id={menuId} aria-label={spanish ? "Participa" : "Get involved"}>
          <a href={campaignUrl} onClick={() => act("campaign")}>{spanish ? "Sitio de la campaña" : "Campaign website"}</a>
          <a href={voteUrl} onClick={() => act("vote")}>{spanish ? "Cómo votar" : "How to vote"}</a>
          <a href={volunteerUrl} onClick={() => act("volunteer")}>{spanish ? "Hazte voluntario" : "Volunteer"}</a>
          <a className="t4a-slack" href="https://volunteerforabdul.slack.com/" onClick={() => act("slack")}>{spanish ? "Únete al Slack de voluntarios" : "Join volunteer Slack"}</a>
        </nav>
        {onLanguageChange && <button className="t4a-language" type="button" onClick={onLanguageChange} lang={spanish ? "en" : "es"} aria-label={spanish ? "View site in English" : "Ver el sitio en español"}>{spanish ? "English" : "Español"}</button>}
        <button className="t4a-menu" type="button" ref={toggleRef} aria-expanded={menuOpen} aria-controls={menuId} onClick={() => setMenuOpen(open => !open)}>
          <span className="t4a-burger" aria-hidden="true"><i /><i /><i /></span>
          {spanish ? "Menú" : "Menu"}
        </button>
      </div>
      <nav className="t4a-nav" ref={toolsRef} aria-label={spanish ? "Herramientas de Tools for Abdul" : "Tools for Abdul"}>
        {tools.map(tool => <a key={tool.id} href={`${base}${tool.path}`} aria-current={tool.id === current ? "page" : undefined}>{tool[locale]}</a>)}
      </nav>
      {children}
    </header>
  </>;
}
