declare global {
  interface PromiseConstructor {
    any<T>(
      arrayOfPromises: Array<T | PromiseLike<T>>
    ): Promise<PromiseAnyResult>
  }
}

type PromiseAnyResult = {
  errors: Error[]
  successes: any[]
}

Promise.any = (
  arrayOfPromises: Array<Promise<any>>
): Promise<PromiseAnyResult> => {
  const result: PromiseAnyResult = {
    errors: [],
    successes: [],
  }

  return Promise.all(
    arrayOfPromises.map((promise: Promise<any>) => {
      return promise
        .catch((error: Error) => {
          result.errors.push(error)
        })
        .then((success: any) => {
          if (success) {
            result.successes.push(success)
          }
        })
    })
  ).then(() => {
    return result
  })
}

export default { Promise }
