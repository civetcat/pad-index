"use client";

import { parseDisplayLang, type DisplayLang } from "@/lib/i18n";

const labels: Record<Exclude<DisplayLang, "en">, string> = {
  cht: "繁中",
  ja: "日文",
};

function writeLang(lang: DisplayLang) {
  document.cookie = `pad_lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`;
  window.location.reload();
}

export function LanguageSwitch() {
  const current = parseDisplayLang(
    typeof document === "undefined"
      ? undefined
      : document.cookie.match(/(?:^|; )pad_lang=([^;]+)/)?.[1],
  );
  function choose(lang: DisplayLang) {
    writeLang(lang);
  }
  return (
    <span className="flex shrink-0 items-center gap-1 px-2 text-xs">
      {(Object.keys(labels) as Array<Exclude<DisplayLang, "en">>).map((lang) => (
        <button
          key={lang}
          className={lang === current ? "font-semibold text-accent" : "text-muted"}
          onClick={() => choose(lang)}
          type="button"
        >
          {labels[lang]}
        </button>
      ))}
    </span>
  );
}
