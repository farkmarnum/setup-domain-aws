import ora from 'ora'

const startSpinner = (description: string) => {
  const spinner = ora({ text: description, spinner: 'pong' }).start()
  return spinner
}

export default startSpinner
