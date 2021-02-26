import Ssm from 'aws-sdk/clients/ssm'
import log from '../logger'

const setSecretFactory = (prefix: string, ssm: Ssm) => async (
  key: string,
  Value: string,
) => {
  const Name = `${prefix}${key}`

  await ssm
    .putParameter({
      Name,
      Value,
      Type: 'SecureString',
    })
    .promise()
}

const handleSsm = async ({
  domain,
  region,
  hostedZoneId,
  certificateArn,
  targetValue: prefix,
  isDemo,
}: StoreConfigHandlerParams): Promise<void> => {
  if (!isDemo) {
    const ssm = new Ssm({ region })
    const setSecret = setSecretFactory(prefix, ssm)

    await setSecret('DOMAIN', domain)
    await setSecret('HOSTED_ZONE_ID', hostedZoneId)
    await setSecret('CERTIFICATE_ARN', certificateArn)
  }

  log.log('Setting AWS Secrets Manager secrets complete!')
}

export default handleSsm
