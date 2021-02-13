import { Command } from 'commander'
import Logger from './logger'

type Options = Record<string, any>

interface DomainResult { domain: string, hostedZoneId: string }
interface CertResult { certificateArn: string }

const log = new Logger()

const program = new Command()
program.version('0.0.1')

const handleVerbosity = (callback: (options: Options) => any) => (options: Options): void => {
  if (options.verbose) log.setLogLevel('info')
  if (options.extraVerbose) log.setLogLevel('debug')

  callback(options)
}

const registerDomain = async (options: Options): Promise<DomainResult> => {
  log.log('Registering domain')
  let { domain } = options
  if (!domain) {
    log.debug('No domain provided in CLI arguments, prompting user...')
    // get user input
    domain = 'google.com'
  }
  const hostedZoneId = ''
  log.info(`Hosted zone created: ${hostedZoneId}`)

  log.info('Registering domain complete!')
  return { domain, hostedZoneId }
}

const requestCert = async (options: Options): Promise<CertResult> => {
  log.log('Requesting TLS certificate from ACM')
  let { domain } = options
  if (!domain) {
    log.debug('No domain provided in CLI arguments, prompting user...')
    // get user input
    domain = 'google.com'
  }
  const certificateArn = ''
  log.info(`Certificate created. Arn: ${certificateArn}`)

  log.info('Requesting TLS certificate from ACM complete!')
  return { certificateArn }
}

const setSecrets = async (options: Options) => {
  log.log('Setting GitHub Secrets')
  let { domain, hostedZoneId, certificateArn } = options
  if (!domain) {
    log.debug('No domain provided in CLI arguments, prompting user...')
    // get user input
    domain = 'google.com'
  }
  if (!hostedZoneId) {
    log.debug('No hostedZoneId provided in CLI arguments, prompting user...')
    // get user input
    hostedZoneId = 'google.com'
  }
  if (!certificateArn) {
    log.debug('No certificateArn provided in CLI arguments, prompting user...')
    // get user input
    certificateArn = 'google.com'
  }

  log.info('Setting GitHub Secrets complete!')
}

const full = async (options: Options) => {
  const { domain, hostedZoneId } = await registerDomain(options)
  const { certificateArn } = await requestCert(options)
  await setSecrets({ ...options, domain, hostedZoneId, certificateArn })
}


program
  .command('full')
  .description('Register domain, request certificate & validate via DNS, and set HOSTED_ZONE_ID, DOMAIN, & CERTIFICATE_ARN as secrets in GitHub repo.')
  .option('-v, --verbose', 'Verbose mode')
  .option('-vv, --extra-verbose', 'Debug mode')
  .option('-p, --profile <profile name>', 'AWS profile to use (if unspecified, uses \'default\'')
  .option('-d, --domain <domain name>', 'AWS profile to use (if unspecified, uses \'default\'')
  .action(handleVerbosity(full))
  
program
  .command('register')
  .description('Register domain in Route53')
  .option('-v, --verbose', 'Verbose mode')
  .option('-vv, --extra-verbose', 'Debug mode')
  .option('-p, --profile <profile name>', 'AWS profile to use (if unspecified, uses \'default\'')
  .action(handleVerbosity(registerDomain))
  
program
  .command('cert')
  .description('Request certificate in ACM & validate via Route53 DNS')
  .option('-v, --verbose', 'Verbose mode')
  .option('-vv, --extra-verbose', 'Debug mode')
  .option('-p, --profile <profile name>', 'AWS profile to use (if unspecified, uses \'default\'')
  .action(handleVerbosity(requestCert))

program
  .command('set-secrets')
  .description('set HOSTED_ZONE_ID and DOMAIN as secrets in GitHub repo')
  .option('-v, --verbose', 'Verbose mode')
  .option('-vv, --extra-verbose', 'Debug mode')
  .action(handleVerbosity(setSecrets))

program.parse()
