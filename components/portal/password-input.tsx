"use client";
import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { portalLang } from "./i18n";

export function PasswordInput(props: ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);
  const en = portalLang() === "en";
  const label = visible
    ? en
      ? "Hide password"
      : "パスワードを隠す"
    : en
      ? "Show password"
      : "パスワードを表示";
  return (
    <span className="pt-password-input">
      <input {...props} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="pt-info-button"
        aria-label={label}
        title={label}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </span>
  );
}
