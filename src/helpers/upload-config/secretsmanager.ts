import Secretsmanager from 'aws-sdk/clients/secretsmanager'
import log from '../logger'

const setSecretFactory = (
  prefix: string,
  secretsmanager: Secretsmanager,
) => async (key: string, SecretString: string) => {
  const SecretId = `${prefix}${key}`

  try {
    await secretsmanager.updateSecret({ SecretId, SecretString }).promise()
  } catch (err) {
    if (err.code === 'ResourceNotFoundException') {
      console.log('creating:', SecretId, SecretString)
      await secretsmanager
        .createSecret({ Name: SecretId, SecretString })
        .promise()
    } else {
      console.error(err)
      throw new Error(err)
    }
  }
}

const handleSecretsmanager = async ({
  domain,
  region,
  hostedZoneId,
  certificateArn,
  targetValue: prefix,
  isDemo,
}: StoreConfigHandlerParams): Promise<void> => {
  if (!isDemo) {
    const secretsmanager = new Secretsmanager({ region })
    const setSecret = setSecretFactory(prefix, secretsmanager)

    await setSecret('DOMAIN', domain)
    await setSecret('HOSTED_ZONE_ID', hostedZoneId)
    await setSecret('CERTIFICATE_ARN', certificateArn)
  }

  log.log('Setting AWS Secrets Manager secrets complete!')
}

export default handleSecretsmanager
