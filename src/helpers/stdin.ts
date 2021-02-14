import fs from 'fs'

export const loadPipedData = async (): Promise<void> =>
  new Promise((resolve) => {
    process.stdin.setEncoding('utf8')

    const dataWasPiped = fs.fstatSync(0).isFIFO()
    if (!dataWasPiped) resolve()

    let input = ''

    process.stdin.on('data', (data: string) => {
      input += data
    })

    process.stdin.on('end', () => {
      input = input.trim()
      global.pipedInput = input
      process.stdin.removeAllListeners('data')
      process.stdin.removeAllListeners('end')
      resolve()
    })
  })
