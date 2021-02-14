import log from './helpers/logger'
// import startSpinner from './helpers/loader'
// import { sleep } from './helpers/util'
import { prompt, validateDomainOrSubdomain } from './helpers/prompt'
import ACM from 'aws-sdk/clients/acm'

const requestCert = async (options: Options): Promise<CertResult> => {
  log.log('Requesting TLS certificate from ACM')

  const acm = new ACM({ apiVersion: '2015-12-08' })
  let { domain } = options

  if (!domain) {
    domain = (await prompt({
      message: 'What domain do you need a certificate for?',
      validate: validateDomainOrSubdomain,
    })) as string
  }

  const { CertificateArn: certificateArn } = await acm
    .requestCertificate({
      DomainName: domain,
      ValidationMethod: 'DNS',
      SubjectAlternativeNames: [`*.${domain}`],
      IdempotencyToken: domain,
    })
    .promise()

  if (!certificateArn) {
    log.error('Certificate request failed!')
    process.exit(1)
  }

  log.info(`Certificate created. Arn: ${certificateArn}`)
  return { certificateArn }
}

export default requestCert
