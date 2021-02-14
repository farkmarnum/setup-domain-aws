import log from './helpers/logger'
import { prompt, validateDomainOrSubdomain } from './helpers/prompt'

const uploadConfig = async (options: Options) => {
  log.log('Setting GitHub Secrets')

  let { domain, hostedZoneId, certificateArn } = options
  if (!domain) {
    domain = await prompt({
      message: 'What is the value of DOMAIN?',
      validate: validateDomainOrSubdomain,
    })
  }
  if (!hostedZoneId) {
    hostedZoneId = await prompt({
      message: 'What is the value for HOSTED_ZONE_ID?',
    })
  }
  if (!certificateArn) {
    certificateArn = await prompt({
      message: 'What is the value for CERTIFICATE_ARN?',
    })
  }

  // TODO:
  log.info('Setting GitHub Secrets complete!')
}

export default uploadConfig
