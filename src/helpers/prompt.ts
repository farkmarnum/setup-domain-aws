import prompts from 'prompts'
import log from './logger'
import fs from 'fs'
import tty from 'tty'

let stdin: NodeJS.ReadStream & { fd?: 0 } = process.stdin

if (!tty.isatty(0)) {
  const ttyFd = fs.openSync('/dev/tty', 'r')
  stdin = new tty.ReadStream(ttyFd)
}

export const prompt = async ({
  message,
  type = 'text',
  initial,
  choices,
  validate = () => true,
}: PromptArgs): Promise<any> => {
  const { response } = await prompts(
    {
      name: 'response',
      type,
      message,
      validate,
      initial,
      choices,
      stdin,
    },
    {
      onCancel: () => {
        log.info('User interrupt! Exiting.')
        process.exit(1)
        return true
      },
    },
  )

  return response
}
