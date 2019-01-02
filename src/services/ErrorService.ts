export type ErrorCategory =
  | 'JSON.parse'
  | 'fetch.GET'
  | 'fetch.POST'
  | 'fetch.DELETE'

type QualifiedError = {
  category: ErrorCategory
  error: Error
  message?: string
}

class ErrorService {
  private errors: QualifiedError[] = []

  public log(category: ErrorCategory, error: Error, message?: string) {
    console.error(error)
    this.errors.push({
      category,
      error,
      message,
    })
  }
}

export default new ErrorService()
