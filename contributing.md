# Contributing to Fingerprint Pro Fastly Compute@Edge Proxy Integration

## Requirements

- Node 20+
- TypeScript 5+
- [Fastly CLI](https://developer.fastly.com/learning/compute/#install-the-fastly-cli)

## Working with the Code

We prefer using [pnpm](https://pnpm.io/) for managing dependencies and running scripts.

For proposing changes, use the standard [pull request approach](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request). It’s recommended to discuss fixes or new features in the Issues first.

- The `main` branch is locked for direct pushes.
- The `rc` branch is used for active development of new features.
- Releases are created from the `main` branch.

### How to Build

1. After cloning the repository, run `pnpm install` to install dependencies.
2. Run `pnpm build` to compile the project and assemble the WebAssembly output.
3. The build artifact is located in the `bin/main.wasm` file, which will be deployed to Fastly.

### Code Style

We enforce code quality using [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/). To check code style:

```shell
pnpm lint
```

You aren't required to run these checks manually, as the CI pipeline will handle it. However, to fix code style issues locally:

```shell
pnpm lint:fix
```

### Commit Style

We follow [conventional commits](https://www.conventionalcommits.org) for commit messages.

### How to Test

#### Unit Tests

To run unit tests:

```shell
pnpm test
```

#### End-to-End (e2e) Tests

End-to-end tests are run automatically for every pull request using our CI workflows.
