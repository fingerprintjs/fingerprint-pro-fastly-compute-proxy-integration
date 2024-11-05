<p align="center">
<a href="https://fingerprint.com">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://fingerprintjs.github.io/home/resources/logo_light.svg" />
<source media="(prefers-color-scheme: light)" srcset="https://fingerprintjs.github.io/home/resources/logo_dark.svg" />
<img src="https://fingerprintjs.github.io/home/resources/logo_dark.svg" alt="Fingerprint logo" width="312px" />
</picture>
</a>
</p>
<p align="center">
<a href="https://github.com/fingerprintjs/fingerprint-pro-fastly-compute-proxy-integration"><img src="https://img.shields.io/github/v/release/fingerprintjs/fingerprint-pro-fastly-compute-proxy-integration" alt="Current version"></a>
<a href="https://fingerprintjs.github.io/fingerprint-pro-fastly-compute-proxy-integration/"><img src="https://raw.githubusercontent.com/fingerprintjs/fingerprint-pro-fastly-compute-proxy-integration/gh-pages/badges.svg" alt="coverage"></a>
<a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/:license-mit-blue.svg" alt="MIT license"></a>
<a href="https://discord.gg/39EpE2neBg"><img src="https://img.shields.io/discord/852099967190433792?style=logo&label=Discord&logo=Discord&logoColor=white" alt="Discord server"></a>
</p>

# Fingerprint Pro Fastly Compute Proxy Integration

[Fingerprint](https://fingerprint.com) is a device intelligence platform offering highly accurate visitor identification.

The Fastly Compute Proxy Integration is responsible for proxying identification and agent-download requests between your application and Fingerprint through your Fastly infrastructure. This integration uses [Fastly Compute services](https://www.fastly.com/products/compute).

## 🚧 Requirements and expectations

* **Integration in Beta**: Please report any issues to our [support team](https://fingerprint.com/support/).

* **Limited to Enterprise customers**: At this point, this proxy integration is accessible and exclusively supported for customers on the  **Enterprise** Plan. Other customers are encouraged to use [Custom subdomain setup](https://dev.fingerprint.com/docs/custom-subdomain-setup) or [Cloudflare Proxy Integration](https://dev.fingerprint.com/docs/cloudflare-integration).

* **Manual updates occasionally required**: The underlying data contract in the identification logic can change to keep up with browser updates. Using the Fastly Compute Proxy Integration might require occasional manual updates on your side. Ignoring these updates will lead to lower accuracy or service disruption.

## Getting started

This is a quick overview of the installation setup. For detailed step-by-step instructions, see the [Fastly Compute proxy integration guide in our documentation](https://dev.fingerprint.com/docs/fastly-compute-proxy-integration).

1. Go to the Fingerprint Dashboard > [**API Keys**](https://dashboard.fingerprint.com/api-keys) and click **Create Proxy Key** to create a proxy secret. You will use it later to authenticate your requests to Fingerprint APIs.

2. [Create a Config store](https://docs.fastly.com/en/guides/working-with-config-stores#creating-a-config-store) in your Fastly account named exactly `Fingerprint` and add the following values:

   | Key                          | Example Value        | Description                                                                                 |
   |------------------------------|----------------------|---------------------------------------------------------------------------------------------|
   | PROXY_SECRET                 | 6XI9CLf3C9oHSB12TTaI | Fingerprint proxy secret generated in Step 1.                                                |
   | OPEN_CLIENT_RESPONSE_ENABLED | false                | Set to `true` if you have [Open client response](https://dev.fingerprint.com/docs/open-client-response) enabled for your Fingerprint application. Defaults to `false`. |
   | AGENT_SCRIPT_DOWNLOAD_PATH   | z5kms2               | Random path segment for downloading the JavaScript agent.                                           |
   | GET_RESULT_PATH              | nocmjw               | Random path segment for Fingerprint identification requests.                                     |

3. Go to [Releases](https://github.com/fingerprintjs/fingerprint-pro-fastly-compute-proxy-integration/releases) to download the latest `fingerprint-proxy-integration.tar.gz` package file.
4. Upload package to your Fastly Compute Service's **Package**.
5. Configure the Fingerprint [JavaScript Agent](https://dev.fingerprint.com/docs/install-the-javascript-agent#configuring-the-agent) on your website using the paths defined in Step 2.
    ```javascript
   import * as FingerprintJS from '@fingerprintjs/fingerprintjs-pro'

   const fpPromise = FingerprintJS.load({
     apiKey: 'PUBLIC_API_KEY',
     scriptUrlPattern: [
       'https://metrics.yourwebsite.com/AGENT_SCRIPT_DOWNLOAD_PATH?apiKey=<apiKey>&version=<version>&loaderVersion=<loaderVersion>',
       FingerprintJS.defaultScriptUrlPattern, // Fallback to default CDN in case of error
     ],
     endpoint: [
       'https://metrics.yourwebsite.com/GET_RESULT_PATH?region=us',
       FingerprintJS.defaultEndpoint // Fallback to default endpoint in case of error
     ],
   });
   ```

See the [Fastly Compute proxy integration guide](https://dev.fingerprint.com/docs/fastly-compute-proxy-integration#step-4-configure-the-fingerprint-client-agent-to-use-your-service) in our documentation for more details.

### Using a custom config store name

The Fastly Compute package provided in releases assumes the Config store used by the integration is named `Fingerprint_Fastly_Compute_Proxy_Integration_ConfigStore_<SERVICE_ID>`, where the suffix is your proxy integration's [Compute Service ID](https://docs.fastly.com/en/guides/about-services). If you need to use a different config store name prefix, you can pass the name to the `STORE_NAME_PREFIX` environment variable and build a custom service package:

```shell
STORE_NAME_PREFIX=MyCustomStoreNamePrefix pnpm run build
```

The code inside the built package will expect a config store name like: `<Config store name (default to: Fingerprint_Fastly_Compute_Proxy_Integration)>_ConfigStore_<Your fastly compute service id>`
For example: `Fingerprint_Fastly_Compute_Proxy_Integration_ConfigStore_MxLpeV9YSRbQKxlGpCVnD5` if you use the artifact in the release.
Or: `MyCustomConfigStoreName_ConfigStore_MxLpeV9YSRbQKxlGpCVnD5` if you build your own artifact with a custom config store name.

## Feedback and support

Please reach out to our [Customer Success team](https://fingerprint.com/support/) if run into any issues with the integration.

## License

This project is licensed under the [MIT license](./LICENSE).
