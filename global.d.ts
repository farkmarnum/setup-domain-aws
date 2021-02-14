type Options = {
  verbose?: boolean
  extraVerbose?: boolean
  domain?: string
  hostedZoneId?: string
  certificateArn?: string
  profile?: string
}

interface DomainResult {
  domain: string
  hostedZoneId: string
}

interface CertResult {
  certificateArn: string
}

interface PromptArgs {
  message: string
  type?: import('prompts').PromptType
  validate?: (arg0: string) => boolean | string
  initial?: any
}
