export const GRADE_LEVELS = [9, 10, 11, 12] as const

export type GradeLevel = (typeof GRADE_LEVELS)[number]

const GRADE_NAMES: Record<GradeLevel, string> = {
  9: "Freshman",
  10: "Sophomore",
  11: "Junior",
  12: "Senior",
}

function ordinal(n: number) {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  const mod10 = n % 10
  if (mod10 === 1) return `${n}st`
  if (mod10 === 2) return `${n}nd`
  if (mod10 === 3) return `${n}rd`
  return `${n}th`
}

export function formatGradeLevel(grade: number | null | undefined) {
  if (grade == null) return "Not set"
  if (!GRADE_LEVELS.includes(grade as GradeLevel)) return "Not set"
  const level = grade as GradeLevel
  return `${ordinal(level)} grade (${GRADE_NAMES[level]})`
}

export function gradeLevelOptionLabel(grade: GradeLevel) {
  return `${ordinal(grade)} grade (${GRADE_NAMES[grade]})`
}

export function isValidGradeLevel(value: number | null) {
  return value == null || GRADE_LEVELS.includes(value as GradeLevel)
}
