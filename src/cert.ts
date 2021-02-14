import log from './helpers/logger'
import startSpinner from './helpers/loader'
import { sleep } from './helpers/util'
import { prompt, validateDomainOrSubdomain } from './helpers/prompt'
import { getStoredContactDetails } from './helpers/storage'
import Route53Domains from 'aws-sdk/clients/route53domains'
import Route53 from 'aws-sdk/clients/route53'

const requestCert = async (options: Options): Promise<CertResult> => {
  log.log('Requesting TLS certificate from ACM')

  // const route53 = new Route53({ apiVersion: '2013-04-01' })
  let { domain } = options

  if (!domain) {
    domain = (await prompt({
      message: 'What domain do you need a certificate for?',
      validate: validateDomainOrSubdomain,
    })) as string
  }

  const certificateArn = 'TODO'
  log.info(`Certificate created. Arn: ${certificateArn}`)
  return { certificateArn }
}

export default requestCert
