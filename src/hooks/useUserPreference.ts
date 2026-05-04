import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import {
  DEFAULT_USER_PREFERENCES,
  readUserPreferences,
  USER_PREFERENCES_CHANGED_EVENT,
  writeUserPreferencesPatch,
} from '../lib/userPreferences'
import type { UserPreferences } from '../types/preferences'

type UserPreferencesChangedEvent = CustomEvent<Partial<UserPreferences>>

const resolveStateAction = <T>(action: SetStateAction<T>, previous: T) =>
  typeof action === 'function'
    ? (action as (previousValue: T) => T)(previous)
    : action

export const useUserPreference = <K extends keyof UserPreferences>(
  key: K,
): [UserPreferences[K], Dispatch<SetStateAction<UserPreferences[K]>>] => {
  const [value, setValue] = useState<UserPreferences[K]>(() => readUserPreferences()[key])
  const valueRef = useRef(value)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    const handlePreferencesChanged = (event: Event) => {
      const detail = (event as UserPreferencesChangedEvent).detail
      if (!detail || !(key in detail)) return

      const nextValue = (detail[key] ?? DEFAULT_USER_PREFERENCES[key]) as UserPreferences[K]
      valueRef.current = nextValue
      setValue(nextValue)
    }

    window.addEventListener(USER_PREFERENCES_CHANGED_EVENT, handlePreferencesChanged)
    return () => window.removeEventListener(USER_PREFERENCES_CHANGED_EVENT, handlePreferencesChanged)
  }, [key])

  const updateValue = useCallback<Dispatch<SetStateAction<UserPreferences[K]>>>((action) => {
    const nextValue = resolveStateAction(action, valueRef.current)
    valueRef.current = nextValue
    setValue(nextValue)
    writeUserPreferencesPatch({ [key]: nextValue } as Partial<UserPreferences>)
  }, [key])

  return [value, updateValue]
}
