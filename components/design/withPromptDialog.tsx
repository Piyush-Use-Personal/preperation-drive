"use client";

import { useRef, useState } from "react";
import { BottomSheet } from "@/components/design/BottomSheet";

type PromptOptions = {
  title: string;
  label?: string;
  placeholder?: string;
  confirmText?: string;
  defaultValue?: string;
};

export type PromptDialogFn = (options: PromptOptions) => Promise<string | null>;

export type WithPromptDialogProps = {
  promptText: PromptDialogFn;
};

export function withPromptDialog<P extends object>(
  Wrapped: React.ComponentType<P & WithPromptDialogProps>,
) {
  function PromptEnhanced(props: P) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    const [pending, setPending] = useState(false);
    const [options, setOptions] = useState<PromptOptions>({
      title: "Enter value",
      label: "Value",
      placeholder: "",
      confirmText: "Save",
      defaultValue: "",
    });
    const resolverRef = useRef<((value: string | null) => void) | null>(null);

    const close = () => {
      if (pending) return;
      setOpen(false);
      setValue("");
      if (resolverRef.current) {
        resolverRef.current(null);
        resolverRef.current = null;
      }
    };

    const promptText: PromptDialogFn = (nextOptions) => {
      const merged = {
        label: "Name",
        confirmText: "Create",
        placeholder: "",
        defaultValue: "",
        ...nextOptions,
      };
      setOptions(merged);
      setValue(merged.defaultValue ?? "");
      setOpen(true);
      return new Promise((resolve) => {
        resolverRef.current = resolve;
      });
    };

    const submit = () => {
      const trimmed = value.trim();
      if (!trimmed) return;
      if (resolverRef.current) {
        resolverRef.current(trimmed);
        resolverRef.current = null;
      }
      setPending(true);
      setOpen(false);
      setValue("");
      setPending(false);
    };

    return (
      <>
        <Wrapped {...props} promptText={promptText} />
        <BottomSheet open={open} title={options.title} onClose={close}>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#5f6b66]">
                {options.label}
              </span>
              <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={options.placeholder}
                className="h-12 w-full rounded-xl border border-[#d8e3dd] bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-[#8fb8a9] focus:ring-2 focus:ring-[#c9e2d8]"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={close}
                className="flex-1 rounded-xl border border-[#d8e3dd] bg-white py-3 text-sm font-medium text-[#47534f] transition hover:bg-[#f4f8f6]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!value.trim()}
                className="flex-1 rounded-xl bg-[var(--primary)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {options.confirmText}
              </button>
            </div>
          </div>
        </BottomSheet>
      </>
    );
  }

  PromptEnhanced.displayName = `withPromptDialog(${Wrapped.displayName || Wrapped.name || "Component"})`;
  return PromptEnhanced;
}
