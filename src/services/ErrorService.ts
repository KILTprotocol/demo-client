class ErrorService {
  private errors: Error[] = []

  public log(e: Error) {
    console.error(e)
    this.errors.push(e)
  }
}

export default new ErrorService()
