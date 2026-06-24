import { PUZZLE_TYPES, type PrivateDay, type PrivatePuzzle } from "@hva/domain";

export type ValidationIssue = {
  path: string;
  message: string;
};

export type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

const puzzleTypes = new Set<string>(PUZZLE_TYPES);

function issue(path: string, message: string): ValidationIssue {
  return { path, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validatePuzzle(puzzle: PrivatePuzzle, path: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!isString(puzzle.slot)) issues.push(issue(`${path}.slot`, "slot is required"));
  if (!isString(puzzle.type)) {
    issues.push(issue(`${path}.type`, "type is required"));
  } else if (!puzzleTypes.has(puzzle.type)) {
    issues.push(issue(`${path}.type`, `unsupported puzzle type "${puzzle.type}"`));
  }
  if (!isString(puzzle.prompt)) issues.push(issue(`${path}.prompt`, "prompt is required"));
  if (!isString(puzzle._answer)) issues.push(issue(`${path}._answer`, "_answer is required"));
  if (!isString(puzzle.unlockWord)) issues.push(issue(`${path}.unlockWord`, "unlockWord is required"));

  const data: Record<string, unknown> = isRecord(puzzle.data) ? puzzle.data : {};

  switch (puzzle.type) {
    case "keypad": {
      if (typeof data.length !== "number") issues.push(issue(`${path}.data.length`, "keypad length must be a number"));
      if (isString(puzzle._answer) && !/^\d+$/.test(puzzle._answer)) {
        issues.push(issue(`${path}._answer`, "keypad answer must be numeric"));
      }
      break;
    }
    case "cipher_wheel": {
      if (!isString(data.encoded)) issues.push(issue(`${path}.data.encoded`, "cipher_wheel encoded text is required"));
      break;
    }
    case "wire": {
      if (!Array.isArray(data.left) || data.left.length === 0) issues.push(issue(`${path}.data.left`, "wire left list is required"));
      if (!Array.isArray(data.right) || data.right.length === 0) issues.push(issue(`${path}.data.right`, "wire right list is required"));
      if (Array.isArray(data.left) && Array.isArray(data.right) && data.left.length !== data.right.length) {
        issues.push(issue(`${path}.data`, "wire left/right lists must have equal length"));
      }
      break;
    }
    case "logic":
    case "multi_choice": {
      if (!Array.isArray(data.options) || data.options.length === 0) {
        issues.push(issue(`${path}.data.options`, `${puzzle.type} options are required`));
      } else if (isString(puzzle._answer) && !data.options.includes(puzzle._answer)) {
        issues.push(issue(`${path}._answer`, "answer must match one of the options"));
      }
      break;
    }
    case "pattern_grid": {
      if (typeof data.rows !== "number") issues.push(issue(`${path}.data.rows`, "pattern_grid rows must be a number"));
      if (typeof data.cols !== "number") issues.push(issue(`${path}.data.cols`, "pattern_grid cols must be a number"));
      break;
    }
  }

  return issues;
}

export function validateDay(day: PrivateDay, path = "day"): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!isString(day.id)) issues.push(issue(`${path}.id`, "id is required"));
  if (typeof day.number !== "number") issues.push(issue(`${path}.number`, "number is required"));
  if (!isString(day.title)) issues.push(issue(`${path}.title`, "title is required"));
  if (!isString(day.stardate)) issues.push(issue(`${path}.stardate`, "stardate is required"));
  if (!isRecord(day.author)) issues.push(issue(`${path}.author`, "author is required"));
  if (!Array.isArray(day.document) || day.document.length === 0) issues.push(issue(`${path}.document`, "document must contain lines"));
  if (!Array.isArray(day.puzzles) || day.puzzles.length === 0) {
    issues.push(issue(`${path}.puzzles`, "puzzles are required"));
  } else {
    const slots = new Set<string>();
    const unlockWords = new Set<string>();

    day.puzzles.forEach((puzzle, index) => {
      issues.push(...validatePuzzle(puzzle, `${path}.puzzles[${index}]`));
      if (isString(puzzle.slot)) {
        if (slots.has(puzzle.slot)) issues.push(issue(`${path}.puzzles[${index}].slot`, `duplicate slot "${puzzle.slot}"`));
        slots.add(puzzle.slot);
      }
      if (isString(puzzle.unlockWord)) unlockWords.add(puzzle.unlockWord);
    });

    const constraintWords = day.finale?.constraintWords ?? [];
    for (const word of unlockWords) {
      if (!constraintWords.includes(word)) {
        issues.push(issue(`${path}.finale.constraintWords`, `missing unlock word "${word}"`));
      }
    }
  }

  if (!isRecord(day.finale)) {
    issues.push(issue(`${path}.finale`, "finale is required"));
  } else {
    if (!isString(day.finale.goal)) issues.push(issue(`${path}.finale.goal`, "finale goal is required"));
    if (!Array.isArray(day.finale.constraintWords)) issues.push(issue(`${path}.finale.constraintWords`, "constraintWords must be an array"));
    if (!isString(day.finale._targetPhrase)) issues.push(issue(`${path}.finale._targetPhrase`, "_targetPhrase is required"));
    if (typeof day.finale.maxAttempts !== "number") issues.push(issue(`${path}.finale.maxAttempts`, "maxAttempts must be a number"));
  }

  return { ok: issues.length === 0, issues };
}

export function validateDays(days: PrivateDay[]): ValidationResult {
  const issues = days.flatMap((day, index) => validateDay(day, `days[${index}]`).issues);
  return { ok: issues.length === 0, issues };
}
