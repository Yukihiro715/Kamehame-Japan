export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const passwordRules = (en: boolean) =>
  en
    ? "Use 8–128 characters, including uppercase and lowercase letters and a symbol."
    : "8〜128文字で、大文字・小文字・記号を各1文字以上含めてください。";

export function validNewPassword(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= PASSWORD_MIN &&
    value.length <= PASSWORD_MAX &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[!-/:-@\[-`{-~]/.test(value)
  );
}
