import { useEffect, useState } from 'react'

export function usePictureState(src?: string | null, externalError = false) {
  const [isLoading, setIsLoading] = useState(!!src)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (src && !externalError) {
      setIsLoading(true)
      setHasError(false)
    } else {
      setIsLoading(false)
      setHasError(!!externalError)
    }
  }, [src, externalError])

  return {
    isLoading,
    hasError,
    onLoad: () => setIsLoading(false),
    onError: () => {
      setIsLoading(false)
      setHasError(true)
    },
  }
}
