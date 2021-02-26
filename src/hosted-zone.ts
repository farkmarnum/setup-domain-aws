import log from './helpers/logger'
import { prompt } from './helpers/prompt'
import { getDomainInfo } from './helpers/domain'
import Route53 from 'aws-sdk/clients/route53'

const getHostedZoneId = async (options: Options): Promise<HostedZoneResult> => {
  const { isDemo } = options

  let { region, domain } = options

  if (!domain) {
    domain = (await prompt({
      message: 'Which domain?',
    })) as string
  }

  if (!region) {
    region = await prompt({
      message: 'Which AWS region?',
      initial: 'us-east-1',
    })
  }

  const { isSubdomain, tld, sld } = getDomainInfo(domain)
  if (isSubdomain) {
    domain = `${sld}.${tld}`
  }

  const route53 = new Route53({ apiVersion: '2013-04-01', region })

  if (isDemo) {
    return { hostedZoneId: 'placeholder' }
  }

  const hostedZones = await route53.listHostedZones().promise()

  const hostedZone = hostedZones.HostedZones.find(
    ({ Name: name }) => name === `${domain}.`,
  )

  if (!hostedZone) {
    log.error(`Unable to retrieve hosted zone for domain ${domain}`)
    process.exit(1)
  }

  const hostedZoneId = hostedZone.Id.replace(/\/hostedzone\//, '')

  log.debug(`Got hosted zone ID: ${hostedZoneId}`)

  return { hostedZoneId }
}

export default getHostedZoneId
