/**
 * Indian vehicle number plate formatter.
 *
 * Canonical form:        TN38AB1234 (11 chars, no spaces, uppercase)
 * Display form:          TN-38-AB-1234 (grouped for readability)
 * Input normalization:   any format → canonical → display
 *
 * Format: <STATE><DISTRICT><LETTERS><NUMBERS>
 *   STATE     = 2 letters (e.g. TN, KA, DL)
 *   DISTRICT  = 1-2 digits (e.g. 38, 07, 1)
 *   LETTERS   = 1-3 letters (e.g. AB, Z, ABC)
 *   NUMBERS   = 1-4 digits (e.g. 1234)
 *   Example:  TN38AB1234 → "TN-38-AB-1234"
 */

/**
 * Strip all non-alphanumeric chars and uppercase.
 */
function normalize(raw) {
  return (raw || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/**
 * Parse a normalized plate string into its components.
 * Returns null if the string doesn't look like a valid Indian plate.
 */
function parse(cleaned) {
  // At minimum: 2 letters + 1 digit + 1 letter + 1 digit = 5 chars
  if (cleaned.length < 5 || cleaned.length > 12) return null;

  // State code: first 2 chars must be letters
  const state = cleaned.slice(0, 2);
  if (!/^[A-Z]{2}$/.test(state)) return null;

  // District: digits after state
  let rest = cleaned.slice(2);
  const districtMatch = rest.match(/^(\d{1,2})/);
  if (!districtMatch) return null;
  const district = districtMatch[1];
  rest = rest.slice(district.length);

  // Letters: 1-3 chars after district (series code, e.g. AB or ABC)
  const lettersMatch = rest.match(/^([A-Z]{1,3})/);
  if (!lettersMatch) return null;
  const letters = lettersMatch[1];
  rest = rest.slice(letters.length);

  // Numbers: remaining digits (1-4 chars)
  if (rest.length < 1 || rest.length > 4) return null;
  if (!/^\d+$/.test(rest)) return null;
  const numbers = rest;

  return { state, district, letters, numbers };
}

/**
 * Format a raw plate string to Indian display format "TN-38-AB-1234".
 *
 * @param {string} raw - Any format: "tn38ab1234", "TN-38-AB-1234", etc.
 * @returns {string} Formatted plate or the original input if unparseable.
 */
export function formatIndianPlate(raw) {
  if (!raw) return "";
  const cleaned = normalize(raw);
  const parts = parse(cleaned);
  if (!parts) return raw; // Return original if we can't parse
  return `${parts.state}-${parts.district}-${parts.letters}-${parts.numbers}`;
}

/**
 * Normalize a plate string to canonical machine form "TN38AB1234".
 *
 * @param {string} raw - Any format.
 * @returns {string} Canonical form or empty string if unparseable.
 */
export function canonicalPlate(raw) {
  if (!raw) return "";
  const cleaned = normalize(raw);
  const parts = parse(cleaned);
  if (!parts) return cleaned; // Best effort: return stripped/uppercased
  return `${parts.state}${parts.district}${parts.letters}${parts.numbers}`;
}

/**
 * Progressive on-the-fly formatter for license-plate inputs.
 *
 * Uppercase, strips invalid chars, inserts `-` between groups as you type.
 * Tolerates partial input, backspace/paste safe (operates on alphanumerics only,
 * so deleting a dash removes the char before it). Caps groups at 2/2/3/4,
 * ignoring overflow chars.
 *
 * Segmentation (greedy): 2 letters (state) → up to 2 digits (district) →
 * up to 3 letters (series) → up to 4 digits (number). If the first char is
 * a digit, returns the cleaned string as-is without fighting the user.
 *
 * @param {string} raw - Raw input value on every keystroke.
 * @returns {string} Progressively formatted value, e.g. "TN-38-AB-1234".
 * @example
 * formatPlateLive("tn38ab1234") // "TN-38-AB-1234"
 */
export function formatPlateLive(raw) {
  if (!raw) return "";
  const cleaned = normalize(raw);
  if (!cleaned) return "";
  // Don't fight the user when input starts with a digit (e.g. typing a year first).
  if (/^\d/.test(cleaned)) return cleaned;
  const stateMatch = cleaned.match(/^[A-Z]{1,2}/);
  if (!stateMatch) return cleaned;
  const state = stateMatch[0];
  let rest = cleaned.slice(state.length);
  if (!rest) return state;
  let district = "";
  const districtMatch = rest.match(/^(\d{1,2})/);
  if (districtMatch) {
    district = districtMatch[1];
    rest = rest.slice(district.length);
  }
  if (!rest) {
    return district ? `${state}-${district}` : state;
  }
  let series = "";
  const seriesMatch = rest.match(/^([A-Z]{1,3})/);
  if (seriesMatch) {
    series = seriesMatch[1];
    rest = rest.slice(series.length);
  }
  if (!rest) {
    const groups = [state];
    if (district) groups.push(district);
    if (series) groups.push(series);
    return groups.join("-");
  }
  const numberMatch = rest.match(/^(\d{1,4})/);
  const number = numberMatch ? numberMatch[1] : "";
  const groups = [state];
  if (district) groups.push(district);
  if (series) groups.push(series);
  if (number) groups.push(number);
  // Ignore any overflow chars beyond the 2/2/3/4 caps.
  return groups.join("-");
}
