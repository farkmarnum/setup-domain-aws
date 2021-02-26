declare module NodeJS {
  interface Global {
    pipedInput: string | undefined
  }
}

type Options = {
  verbose?: boolean
  extraVerbose?: boolean
  domain?: string
  hostedZoneId?: string
  certificateArn?: string
  profile?: string
  region?: string
  storeConfigTarget?: string
  getPatFromStdin?: boolean
  isDemo?: boolean
}

interface DomainResult {
  domain: string
  region: string
}

interface CertResult {
  certificateArn: string
}

interface HostedZoneResult {
  hostedZoneId: string
}

interface PromptArgs {
  message: string
  type?: import('prompts').PromptType
  validate?: (arg0: string) => boolean | string
  initial?: any
  choices?: import('prompts').Choice[] | undefined
}
