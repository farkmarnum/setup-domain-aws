import fs from 'fs'
import log from '../logger'

interface WriteToFileArgs {
  domain: string
  hostedZoneId: string
  certificateArn: string
  path: string
}

const writeToFile = ({
  domain,
  hostedZoneId,
  certificateArn,
  path,
}: WriteToFileArgs) => {
  const data = `
DOMAIN=${domain}
HOSTED_ZONE_ID=${hostedZoneId}
CERTIFICATE_ARN=${certificateArn}
`

  fs.writeFileSync(path, data)
}

const handleFile = ({
  domain,
  hostedZoneId,
  certificateArn,
  targetValue: path,
  isDemo,
}: StoreConfigHandlerParams): void => {
  if (!isDemo) {
    writeToFile({ domain, hostedZoneId, certificateArn, path })
  }
  log.log('Writing secrets to file complete!')
}

export default handleFile
