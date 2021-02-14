import fs from 'fs'
import log from './helpers/logger'
import { prompt, validateDomainOrSubdomain } from './helpers/prompt'
import { upload } from './helpers/secrets'

const uploadConfig = async (options: Options) => {
  log.debug('uploadConfig')

  let { domain, hostedZoneId, certificateArn, repo } = options
  if (!domain) {
    domain = (await prompt({
      message: 'What is the value of DOMAIN?',
      validate: validateDomainOrSubdomain,
    })) as string
  }
  if (!hostedZoneId) {
    hostedZoneId = (await prompt({
      message: 'What is the value for HOSTED_ZONE_ID?',
    })) as string
  }
  if (!certificateArn) {
    certificateArn = (await prompt({
      message: 'What is the value for CERTIFICATE_ARN?',
    })) as string
  }
  if (!repo) {
    repo = (await prompt({
      message: 'What is the name of the GitHub repository?',
    })) as string
  }

  let auth
  if (options.getPatFromStdin) {
    auth = global.pipedInput?.trim()
  } else {
    auth = await prompt({
      message: 'GitHub personal access token',
    })
  }

  await upload({ auth, repo, name: 'DOMAIN', value: domain })
  await upload({ auth, repo, name: 'HOSTED_ZONE_ID', value: hostedZoneId })
  await upload({ auth, repo, name: 'CERTIFICATE_ARN', value: certificateArn })

  log.log('Setting GitHub Secrets complete!')
}

export default uploadConfig
