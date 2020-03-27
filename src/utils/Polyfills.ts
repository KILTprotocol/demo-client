declare global {
  // eslint-disable-next-line @typescript-eslint/interface-name-prefix
  interface PromiseConstructor {
    any<T>(
      arrayOfPromises: Array<T | PromiseLike<T>>
    ): Promise<PromiseCollectedResults>

    chain<T>(
      arrayOfPromiseMethods: Array<() => Promise<any>>,
      continueOnError?: boolean
    ): Promise<PromiseCollectedResults>
  }
}

type PromiseCollectedResults = {
  errors: Error[]
  successes: any[]
}

Promise.any = (
  arrayOfPromises: Array<Promise<any>>
): Promise<PromiseCollectedResults> => {
  const result: PromiseCollectedResults = {
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

Promise.chain = (
  arrayOfPromiseMethods: Array<() => Promise<any>>,
  continueOnError = false
): Promise<PromiseCollectedResults> => {
  const result: PromiseCollectedResults = {
    errors: [],
    successes: [],
  }

  return arrayOfPromiseMethods
    .reduce(async (previousPromise, nextPromiseMethod: () => Promise<any>) => {
      await previousPromise
      if (continueOnError || !result.errors.length) {
        return nextPromiseMethod()
          .then((success: any) => {
            result.successes.push(success)
          })
          .catch(error => {
            result.errors.push(error)
          })
      }
      return Promise.resolve()
    }, Promise.resolve())
    .then(() => result)
}

export default { Promise }
