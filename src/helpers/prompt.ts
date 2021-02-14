import prompts from 'prompts'
import log from './logger'

export const prompt = async ({
  message,
  type = 'text',
  initial,
  validate = () => true,
}: PromptArgs): Promise<any> => {
  const { response } = await prompts(
    {
      name: 'response',
      type,
      message,
      validate,
      initial,
    },
    {
      onCancel: () => {
        log.info('User interrupt! Exiting.')
        process.exit(1)
      },
    },
  )

  return response
}

const reDomain = /[a-z]+\.[a-z]{2,}/g

export const validateDomain = (value: string) =>
  (value.match(reDomain) || []).length !== 1 ? 'Not a valid domain' : true

const reDomainOrSubdomain = /([a-z]+\.)+[a-z]{2,}/g

export const validateDomainOrSubdomain = (value: string) =>
  (value.match(reDomainOrSubdomain) || []).length !== 1
    ? 'Not a valid domain or subdomain'
    : true
