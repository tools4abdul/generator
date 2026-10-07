import type { ReactNode } from "react";
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
  return <>
    <a className="t4a-skip" href={skipTo}>{spanish ? "Saltar al contenido" : "Skip to content"}</a>
    <header className="t4a-header" data-tool-header="1">
      <div className="t4a-top">
        <a className="t4a-brand" href={`${base}/cliposition/`} aria-label={spanish ? "Tools for Abdul, inicio" : "Tools for Abdul, home"}>
          <span>TOOLS FOR</span><strong>ABDUL<span className="t4a-period">.</span></strong>
        </a>
        <nav className="t4a-utilities" aria-label={spanish ? "Participa" : "Get involved"}>
          <a href={campaignUrl} onClick={() => onAction?.("campaign")}>{spanish ? "Sitio de la campaña" : "Campaign website"}</a>
          <a href={voteUrl} onClick={() => onAction?.("vote")}>{spanish ? "Cómo votar" : "How to vote"}</a>
          <a href={volunteerUrl} onClick={() => onAction?.("volunteer")}>{spanish ? "Hazte voluntario" : "Volunteer"}</a>
          <a className="t4a-slack" href="https://volunteerforabdul.slack.com/" onClick={() => onAction?.("slack")}>{spanish ? "Únete al Slack de voluntarios" : "Join volunteer Slack"}</a>
        </nav>
        {onLanguageChange && <button className="t4a-language" type="button" onClick={onLanguageChange} lang={spanish ? "en" : "es"} aria-label={spanish ? "View site in English" : "Ver el sitio en español"}>{spanish ? "English" : "Español"}</button>}
      </div>
      <nav className="t4a-nav" aria-label={spanish ? "Herramientas de Tools for Abdul" : "Tools for Abdul"}>
        {tools.map(tool => <a key={tool.id} href={`${base}${tool.path}`} aria-current={tool.id === current ? "page" : undefined}>{tool[locale]}</a>)}
      </nav>
      {children}
    </header>
  </>;
}
