/**
 * Centralized API Validation Service
 *
 * Wraps Zod schemas for consistent server-side style validation
 * even though we call Supabase directly from the client.
 *
 * Every validation returns a standardised result object so callers
 * can handle errors uniformly without try/catch.
 *
 * Usage:
 *   const { success, data, errors } = validate(SignInSchema, { email, password });
 *   if (!success) return { error: errors[0] };
 */

import { z,ZodError,ZodSchema,ZodType } from "zod";

// ─── Result Types ─────────────────────────────────────────────────

export type ValidationResult<T> =
  | { success: true; data: T; errors: null }
  | { success: false; data: null; errors: string[] };

export type BulkValidationResult<T extends Record<string, ZodSchema>> = {
  [K in keyof T]: ValidationResult<z.infer<T[K]>>;
};

// ─── Core Validators ──────────────────────────────────────────────

/**
 * Validate data against a Zod schema.
 * Returns a tagged union – never throws.
 *
 * The schema's output type (after defaults) is used for the return type.
 *
 * @example
 * const result = validate(SignInSchema, { email, password });
 * if (!result.success) return showErrors(result.errors);
 * const { email, password } = result.data;
 */
export function validate<S extends ZodType<unknown, z.ZodTypeDef, unknown>>(
  schema: S,
  data: unknown,
): ValidationResult<z.infer<S>> {
  const parsed = schema.safeParse(data);
  if (parsed.success) {
    return { success: true, data: parsed.data, errors: null };
  }
  return {
    success: false,
    data: null,
    errors: formatZodErrors(parsed.error),
  };
}

/**
 * Validate data and throw a human-readable error if it fails.
 * Useful inside store actions where you want a single catch point.
 *
 * @example
 * const data = validateOrThrow(SignInSchema, input);
 */
export function validateOrThrow<S extends ZodType<unknown, z.ZodTypeDef, unknown>>(
  schema: S,
  data: unknown,
  label?: string,
): z.infer<S> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const prefix = label ? `${label}: ` : "";
    throw new Error(`${prefix}${formatZodErrors(parsed.error).join("; ")}`);
  }
  return parsed.data;
}

/**
 * Validate data and silently return `null` on failure.
 * Useful for optional / best-effort validation.
 */
export function validateOrNull<S extends ZodType<unknown, z.ZodTypeDef, unknown>>(
  schema: S,
  data: unknown,
): z.infer<S> | null {
  const parsed = schema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

/**
 * Validate every item in an array against a schema.
 * Returns successes and per-item errors.
 */
export function validateArray<S extends ZodType<unknown, z.ZodTypeDef, unknown>>(
  schema: S,
  items: unknown[],
): {
  success: boolean;
  data: z.infer<S>[];
  errors: { index: number; errors: string[] }[];
} {
  const data: z.infer<S>[] = [];
  const errors: { index: number; errors: string[] }[] = [];

  items.forEach((item, index) => {
    const result = validate(schema, item);
    if (result.success) {
      data.push(result.data);
    } else {
      errors.push({ index, errors: result.errors });
    }
  });

  return {
    success: errors.length === 0,
    data,
    errors,
  };
}

/**
 * Validate multiple independent pieces of data against their respective
 * schemas. All schemas are validated; results are keyed by the input keys.
 *
 * @example
 * const { body, query } = validateAll({
 *   body: { schema: SignInSchema, data: reqBody },
 *   query: { schema: PaginationSchema, data: reqQuery },
 * });
 */
export function validateAll<T extends Record<string, ZodSchema>>(
  validations: {
    [K in keyof T]: { schema: T[K]; data: unknown };
  },
): BulkValidationResult<T> {
  const result = {} as BulkValidationResult<T>;
  for (const key of Object.keys(validations) as (keyof T)[]) {
    const { schema, data } = validations[key] as {
      schema: T[keyof T];
      data: unknown;
    };
    result[key] = validate(schema as ZodType, data) as ValidationResult<
      z.infer<T[keyof T]>
    >;
  }
  return result;
}

// ─── Error Formatting ─────────────────────────────────────────────

/**
 * Convert a ZodError into a flat list of user-friendly error messages.
 *
 * - Field-level errors: `"name: Name is required"`
 * - Nested errors: flattened with dot notation
 * - Array errors: `"items[0].name: Invalid value"`
 */
export function formatZodErrors(error: ZodError): string[] {
  return error.errors.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") + ": " : "";
    return `${path}${issue.message}`;
  });
}

/**
 * Get the first human-readable error message from a ZodError.
 */
export function firstZodError(error: ZodError): string {
  return formatZodErrors(error)[0] ?? "Validation failed";
}

// ─── Partial / Loose Validators ───────────────────────────────────

/**
 * Validate only the fields that are present in the input object
 * (useful for PATCH / partial-update endpoints and store actions).
 *
 * The schema should use `.partial()` or have all optional fields.
 */
export function validatePartial<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
  data: unknown,
): ValidationResult<z.infer<T>> {
  return validate(schema.partial() as unknown as ZodType, data);
}

/**
 * Strip unknown keys from data before validation (useful when
 * accepting raw form data or API payloads that may include extras).
 */
export function validateStrict<S extends ZodType<unknown, z.ZodTypeDef, unknown>>(
  schema: S,
  data: unknown,
): ValidationResult<z.infer<S>> {
  const parsed = schema.safeParse(data);
  if (parsed.success) {
    return { success: true, data: parsed.data, errors: null };
  }
  return {
    success: false,
    data: null,
    errors: formatZodErrors(parsed.error),
  };
}

// ─── Utility Helpers ──────────────────────────────────────────────

/**
 * Check whether an unknown value looks like a Zod validation error.
 */
export function isValidResult<T>(
  result: ValidationResult<T>
): result is { success: true; data: T; errors: null } {
  return result.success;
}

/**
 * Check whether an unknown value is a ZodError instance.
 */
export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}

/**
 * Coerce a value to a Zod schema type — useful for safely parsing
 * query-string parameters or raw JSON.parse output.
 */
export function coerce<S extends ZodType<unknown, z.ZodTypeDef, unknown>>(
  schema: S,
  value: unknown,
  fallback: z.infer<S>,
): z.infer<S> {
  const result = validate(schema, value);
  return result.success ? result.data : fallback;
}
