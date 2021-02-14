#!/usr/bin/env node

import { Command } from 'commander'
import log from './helpers/logger'
import { setCredentials } from './helpers/credentials'
import requestCert from './cert'
import uploadConfig from './config'
import registerDomain from './domain'
import getHostedZoneId from './hosted-zone'

const VERSION = '0.1.3'

export const init = async (
  options: Options,
  callback: (options: Options) => Promise<any>,
): Promise<any> => {
  if (options.verbose) log.setLogLevel('info')
  if (options.extraVerbose) log.setLogLevel('debug')

  const { profile } = options
  setCredentials(profile)

  return await callback(options)
}

const program = new Command()

const full = async (options: Options) => {
  const { domain } = await registerDomain(options)
  const { hostedZoneId } = await getHostedZoneId({ ...options, domain })
  const { certificateArn } = await requestCert({ ...options, domain })
  await uploadConfig({ ...options, domain, hostedZoneId, certificateArn })
}

program
  .version(VERSION)
  .description(
    'Use `setup-domain-aws full` to setup all resources, or other commands to set up one at a time. For example:\n' +
      '  setup-domain-aws full --domain website.tld --region us-east-1 --repo username/repo_name',
  )

program
  .command('full')
  .description(
    'Register domain, request certificate & validate via DNS, and set HOSTED_ZONE_ID, DOMAIN, & CERTIFICATE_ARN as secrets in GitHub repo.',
  )
  .option('-v, --verbose', 'Verbose mode')
  .option('-vv, --extra-verbose', 'Debug mode')
  .option(
    '--profile <profile name>',
    "AWS profile to use (if unspecified, uses 'default')",
  )
  .option('--domain <domain>', 'Domain')
  .option('--region <region>', 'AWS region')
  .option('--repo <repo>', 'GitHub repository')
  .action((options) => init(options, full))

program
  .command('register')
  .description('Register domain in Route53')
  .option('-v, --verbose', 'Verbose mode')
  .option('-vv, --extra-verbose', 'Debug mode')
  .option('--region <region>', 'AWS region')
  .option(
    '--profile <profile name>',
    "AWS profile to use (if unspecified, uses 'default')",
  )
  .action((options) => init(options, registerDomain))

program
  .command('get-hosted-zone')
  .description('Get Hosted Zone Id')
  .option('-v, --verbose', 'Verbose mode')
  .option('-vv, --extra-verbose', 'Debug mode')
  .option('--region <region>', 'AWS region')
  .option('--domain <domain>', 'Domain')
  .option(
    '--profile <profile name>',
    "AWS profile to use (if unspecified, uses 'default')",
  )
  .action((options) => init(options, getHostedZoneId))

program
  .command('cert')
  .description('Request certificate in ACM & validate via Route53 DNS')
  .option('-v, --verbose', 'Verbose mode')
  .option('-vv, --extra-verbose', 'Debug mode')
  .option('--region <region>', 'AWS region')
  .option('--domain <domain>', 'Domain')
  .option(
    '--profile <profile name>',
    "AWS profile to use (if unspecified, uses 'default')",
  )
  .action((options) => init(options, requestCert))

program
  .command('upload-config')
  .description(
    'upload HOSTED_ZONE_ID, CERTIFICATE_ARN, DOMAIN values to GitHub secrets',
  )
  .option('-v, --verbose', 'Verbose mode')
  .option('-vv, --extra-verbose', 'Debug mode')
  .option('--repo <repo>', 'GitHub repository')
  .action((options) => init(options, uploadConfig))

program.parse()
