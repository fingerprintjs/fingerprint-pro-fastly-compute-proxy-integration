export const waitForMs = (ms: number, callback: Function) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      callback()
      resolve(undefined)
    }, ms)
  })
}
