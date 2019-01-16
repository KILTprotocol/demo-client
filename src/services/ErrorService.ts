export type ErrorCategory =
  | 'JSON.parse'
  | 'fetch.GET'
  | 'fetch.POST'
  | 'fetch.DELETE'
  | 'identity.create'

type QualifiedError = {
  category: ErrorCategory
  error: Error
  message?: string
}

class ErrorService {
  private errors: QualifiedError[] = []

  public log(category: ErrorCategory, error: Error, message?: string) {
    console.groupCollapsed(
      '%cERROR @ ' + category,
      'background: red; color: white; padding: 5px;'
    )
    console.error(message)
    console.error(error)
    console.groupEnd()
    this.errors.push({
      category,
      error,
      message,
    })
  }
}

export default new ErrorService()
