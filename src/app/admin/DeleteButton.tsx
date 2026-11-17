"use client";

import { adminDelete } from "./actions";

/** A tiny form posting to the admin delete action, with a confirm() first. */
export function DeleteButton({ fields, confirmText, label = "Delete" }: { fields: Record<string, string>; confirmText: string; label?: string }) {
  return (
    <form action={adminDelete} onSubmit={(e) => !confirm(confirmText) && e.preventDefault()} className="del">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit">{label}</button>
    </form>
  );
}
