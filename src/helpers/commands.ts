import log from './logger'
import { setCredentials } from './credentials'

export const init = async (
  options: Options,
  callback: (options: Options) => Promise<any>,
): Promise<any> => {
  if (options.verbose) log.setLogLevel('info')
  if (options.extraVerbose) log.setLogLevel('debug')

  const { profile } = options
  setCredentials(profile)

  return await callback(options)
}
