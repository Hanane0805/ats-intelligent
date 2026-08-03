'use client';

import { Check, X } from 'lucide-react';
import { getPasswordRequirementResults } from '../../lib/passwordValidation';

interface PasswordStrengthChecklistProps {
  password: string;
  /** Only start showing red/failed states once the user has interacted with the field. */
  active?: boolean;
}

/**
 * Real-time checklist showing which password requirements are currently
 * satisfied. Purely presentational — the actual rules live in
 * `lib/passwordValidation.ts` so other forms can reuse the same policy.
 */
export default function PasswordStrengthChecklist({
  password,
  active = true,
}: PasswordStrengthChecklistProps) {
  const results = getPasswordRequirementResults(password);

  return (
    <ul className="mt-2 space-y-1.5" aria-live="polite">
      {results.map((requirement) => {
        const isValid = requirement.valid;
        const showAsValid = isValid;
        const showAsInvalid = active && !isValid;

        return (
          <li
            key={requirement.key}
            className={`flex items-center gap-2 text-xs transition-colors ${
              showAsValid
                ? 'text-emerald-600'
                : showAsInvalid
                ? 'text-muted-foreground'
                : 'text-muted-foreground'
            }`}
          >
            <span
              className={`flex items-center justify-center w-4 h-4 rounded-full shrink-0 ${
                showAsValid
                  ? 'bg-emerald-500/15 text-emerald-600'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {showAsValid ? (
                <Check className="w-3 h-3" strokeWidth={3} />
              ) : (
                <X className="w-3 h-3" strokeWidth={3} />
              )}
            </span>
            <span>{requirement.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
