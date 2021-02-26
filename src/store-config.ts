import log from './helpers/logger'
import { prompt } from './helpers/prompt'
import { uploadToGitHub, writeToFile } from './helpers/upload'

interface StoreConfigHandlerParams {
  domain: string
  hostedZoneId: string
  certificateArn: string
  targetValue: string
  getPatFromStdin?: boolean
}

const handleGithubSecrets = async ({
  domain,
  hostedZoneId,
  certificateArn,
  targetValue,
  getPatFromStdin,
}: StoreConfigHandlerParams): Promise<void> => {
  let auth
  if (getPatFromStdin) {
    auth = global.pipedInput?.trim()
  } else {
    auth = await prompt({
      message: 'GitHub personal access token',
    })
  }

  const repo = targetValue

  await uploadToGitHub({ auth, repo, name: 'DOMAIN', value: domain })
  await uploadToGitHub({
    auth,
    repo,
    name: 'HOSTED_ZONE_ID',
    value: hostedZoneId,
  })
  await uploadToGitHub({
    auth,
    repo,
    name: 'CERTIFICATE_ARN',
    value: certificateArn,
  })

  log.log('Setting GitHub Secrets complete!')
}

const handleSecretsmanager = async ({
  domain,
  hostedZoneId,
  certificateArn,
  targetValue,
}: StoreConfigHandlerParams): Promise<void> => {
  log.error('TODO!')
}

const handleSsm = async ({
  domain,
  hostedZoneId,
  certificateArn,
  targetValue,
}: StoreConfigHandlerParams): Promise<void> => {
  log.error('TODO!')
}

const handleFile = ({
  domain,
  hostedZoneId,
  certificateArn,
  targetValue,
}: StoreConfigHandlerParams): void => {
  writeToFile({ domain, hostedZoneId, certificateArn, path: targetValue })
}

const storeConfig = async (options: Options) => {
  const { storeConfigTarget, getPatFromStdin } = options
  let { domain, hostedZoneId, certificateArn } = options
  if (!domain) {
    domain = (await prompt({
      message: 'What is the value of DOMAIN?',
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

  let targetType
  let targetValue
  if (storeConfigTarget) {
    ;[targetType, targetValue] = storeConfigTarget
      .split('://')
      .map((str) => str.trim())

    if (!['github', 'secretsmanager', 'ssm', 'file'].includes(targetType)) {
      log.error('Unknown target type')
      process.exit(1)
    }
    if (!targetValue) {
      log.error('Target value required')
      process.exit(1)
    }
  } else {
    try {
      targetType = (await prompt({
        message: 'Where do you want to store the config?',
        type: 'select',
        choices: [
          {
            title: 'GitHub Secrets',
            value: 'github',
          },
          {
            title: 'AWS Secrets Manager',
            value: 'secretsmanager',
          },
          {
            title: 'AWS Systems Manager Parameter Store',
            value: 'ssm',
          },
          {
            title: 'File',
            value: 'file',
          },
        ],
      })) as string
    } catch (err) {
      console.error(err)
    }

    switch (targetType) {
      case 'github':
        targetValue = (await prompt({
          message: 'What is the GitHub repo (<user>/<repo>)?',
        })) as string
        break
      case 'secretsmanager':
        targetValue = (await prompt({
          message: 'What prefix should we use for secretsmanager?',
        })) as string
        break
      case 'ssm':
        targetValue = (await prompt({
          message: 'What prefix should we use for ssm?',
        })) as string
        break
      case 'file':
        targetValue = (await prompt({
          message: 'What path should we use for the file?',
        })) as string
        break
      default:
        log.error('Unknown target type')
        process.exit(1)
    }
  }

  const params = {
    domain,
    hostedZoneId,
    certificateArn,
    targetValue,
  }

  switch (targetType) {
    case 'github':
      await handleGithubSecrets({ ...params, getPatFromStdin })
      break
    case 'secretsmanager':
      await handleSecretsmanager(params)
      break
    case 'ssm':
      await handleSsm(params)
      break
    case 'file':
      handleFile(params)
      break
    default:
      log.error('Unknown target type')
      process.exit(1)
  }
}

export default storeConfig
