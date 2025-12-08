import type { InputJsonValue } from '@prisma/client/runtime/library'

export type Changes = Record<string, { before: InputJsonValue; after: InputJsonValue }>

/**
 * Compare old and new values and return only the changed fields
 * @param prevData Original data
 * @param newData Updated data
 * @param fieldsToCompare Array of field names to compare
 * @returns Changes object or null if nothing changed
 */
export const getChanges = (
  prevData: Record<string, any>,
  newData: Record<string, any>,
  fieldsToCompare: string[]
): Changes | null => {
  const changes: Changes = {}

  fieldsToCompare.forEach((field) => {
    const prevValue = prevData[field]
    const newValue = newData[field]

    const prevValueNormalized = prevValue instanceof Date ? prevValue.toISOString() : prevValue
    const newValueNormalized = newValue instanceof Date ? newValue.toISOString() : newValue

    if (prevValueNormalized !== newValueNormalized) {
      changes[field] = {
        before: prevValueNormalized as InputJsonValue,
        after: newValueNormalized as InputJsonValue,
      }
    }
  })

  return Object.keys(changes).length > 0 ? changes : null
}
