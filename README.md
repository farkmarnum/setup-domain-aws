# setup-domain-aws

Automate the tedious process of domain registration, certificate setup, and GitHub secrets config.

![](demo.gif) 

## Installing & Running

    npm install -g setup-domain-aws
    setup-domain-aws full

or

    npx setup-domain-aws full

## How does it work?

With `setup-domain-aws`, you can **automate this process**:

  1. 🔗 **Registering a domain** (AWS Route53 Domains)
  2. 🥱 Waiting for domain registration request to complete
  3. ✅ **Creating a Route53 Hosted Zone**
  4. 🔐 **Requesting an ACM certificate**
  5. 📜 Adding DNS records for certificate validation
  6. 😴 Waiting for certificate validation to complete
  7. 🤫 **Storing the config info** (`HOSTED_ZONE_ID`, `DOMAIN`, and `CERTIFICATE_ARN`) for CI/CD using one of:
      - in GitHub Secrets
      - in AWS Secrets Manager
      - in AWS Systems Manager Parameter Store
      - in a file
&nbsp;
## Config storage options

#### GitHub Secrets
**`--store-config-target github://<username>/<repo>`**

This will set `HOSTED_ZONE_ID`, `DOMAIN`, and `CERTIFICATE_ARN` as Secrets in the GitHub repository.

*Note: you will need a GitHub Personal Access Token with repo access for this option*

#### AWS Secrets Manager
**`--store-config-target secretsmanager://<prefix>`**

This will create the following SecretString type secrets in secretsmanager, encrpyted with the default CMK:
  - `/<prefix>/HOSTED_ZONE_ID`
  - `/<prefix>/DOMAIN`
  - `/<prefix>/CERTIFICATE_ARN`

#### Systems Manager Parameter Store
**`--store-config-target ssm://<prefix>`**

This will set the following String type parameters in SSM:
  - `/<prefix>/HOSTED_ZONE_ID`
  - `/<prefix>/DOMAIN`
  - `/<prefix>/CERTIFICATE_ARN`

#### File
**`--store-config-target file://<path>`**

This will create a file at `<path>` in this form:
```
HOSTED_ZONE_ID=<value>
DOMAIN=<value>
CERTIFICATE_ARN=<value>
```
&nbsp;
### What if I don't need all that?

You can run any of the steps individually!

  - Use **register** for domain registration
  - Use **get-hosted-zone** to get the hosted zone id for a domain you've registered
  - Use **cert** to request an ACM certificate
  - Use **store-config** to store config info for CI/CD.

Also, if you run `setup-domain-aws full` and you've already completed some of the steps (for example, if you already own the domain), the CLI will skip over those steps.

### Command-line options vs prompts

The examples above use command-line options to supply information. If you don't do that (for example, if you just run `setup-domain-aws full`), the CLI will prompt you for each piece of information it needs.

Note: when using GitHub Secrets as a the store-config target, it is not possible, for security reasons, to pass the GitHub PAT as a command-line parameter. You will be prompted for this information. Alternatively, you can pass the option --get-pat-from-stdin and pipe it:

    # GitHub Actions example:
    echo ${{ secrets.PAT }} | setup-domain-aws store-config --get-pat-from-stdin

    # Mac OS Keychain example:
    security find-generic-password -a ${USER} -s <keychain item name> -w | setup-domain-aws store-config --get-pat-from-stdin


### TODOs

 - Finish:
   - AWS Secrets Manager
   - AWS Systems Manager Parameter Store
 - Allow subdomains to be passed to `setup-domain-aws full`, and parse the root domain for the `domain` step
