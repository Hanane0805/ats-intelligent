/**
 * Reusable password validation utility.
 *
 * Enforces the application's password policy and exposes small,
 * composable helpers so any form (registration, reset password, etc.)
 * can validate a password consistently without duplicating logic.
 */

export interface PasswordRequirement {
  key: string;
  label: string;
  test: (password: string) => boolean;
}

/**
 * Ordered list of requirements that make up the password policy.
 * Add/remove rules here and every consumer (checklist UI, submit guard)
 * stays in sync automatically.
 */
export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    key: 'minLength',
    label: 'Au moins 8 caractères',
    test: (password) => password.length >= 8,
  },
  {
    key: 'uppercase',
    label: 'Une lettre majuscule',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    key: 'lowercase',
    label: 'Une lettre minuscule',
    test: (password) => /[a-z]/.test(password),
  },
  {
    key: 'number',
    label: 'Un chiffre',
    test: (password) => /[0-9]/.test(password),
  },
  {
    key: 'specialChar',
    label: 'Un caractère spécial (!@#$%^&*...)',
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

export interface PasswordRequirementResult {
  key: string;
  label: string;
  valid: boolean;
}

/**
 * Evaluates a password against every requirement and returns a
 * per-requirement pass/fail result, ready to render as a checklist.
 */
export function getPasswordRequirementResults(
  password: string
): PasswordRequirementResult[] {
  return PASSWORD_REQUIREMENTS.map((requirement) => ({
    key: requirement.key,
    label: requirement.label,
    valid: requirement.test(password),
  }));
}

/**
 * Returns true only if the password satisfies every requirement in the
 * policy. Use this as the single source of truth to gate form submission.
 */
export function isPasswordValid(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(password));
}
