/**
 * copyLibraryField — clipboard helper + German toast for Library corner menus.
 * Location: src/app/library/copyLibraryField.ts
 */
import { toast } from 'sonner';

export async function copyLibraryField(label: string, value: string): Promise<boolean> {
  const text = value.trim();
  if (!text) {
    toast.error(`${label} konnte nicht kopiert werden`);
    return false;
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} kopiert`);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    toast.success(`${label} kopiert`);
    return true;
  } catch {
    toast.error(`${label} konnte nicht kopiert werden`);
    return false;
  }
}
