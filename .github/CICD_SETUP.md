# CI/CD Setup Guide

This repository builds and publishes Zhanlu Work with GitHub Actions. The desktop release pipeline reuses
`.github/workflows/_build-reusable.yml` for macOS, Windows, and Linux builds.

## Release Workflows

### `build-and-release.yml`

- Trigger: pushes to `dev` and formal tags.
- Skips tags that contain `-dev-` to avoid rebuilding the auto-created development tags.
- Runs code quality checks, builds desktop artifacts, packs the web CLI, creates a tag for `dev` pushes, and creates a draft GitHub Release.

### `build-manual.yml`

- Trigger: manual `workflow_dispatch`.
- Use this first when validating signing credentials.
- Recommended first runs:
  - `platform=macos-arm64`
  - `platform=macos-x64`

## Required Repository Secrets

Configure these in GitHub: `village-way/AionUi` -> Settings -> Secrets and variables -> Actions.

### macOS Developer ID Signing and Notarization

The current local signing source is:

```text
/Users/devine/ai/vscodium/certs/application.p12
```

Use the Developer ID Application certificate for the Electron `.app`, `.dmg`, and updater `.zip` artifacts. The Developer ID Installer certificate at `certs/installer.p12` is only needed for `.pkg` installers and is not used by the current AionUi release workflow.

| Secret                     | Value                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `BUILD_CERTIFICATE_BASE64` | Base64 of `/Users/devine/ai/vscodium/certs/application.p12`                            |
| `P12_PASSWORD`             | The export password for `application.p12`                                              |
| `KEYCHAIN_PASSWORD`        | A temporary CI keychain password, for example `temp-keychain-password`                 |
| `APPLE_ID`                 | `wandepen@163.com`                                                                     |
| `APPLE_ID_PASSWORD`        | Apple app-specific password used by `notarytool`                                       |
| `TEAM_ID`                  | `EDCUTHX9T2`                                                                           |
| `IDENTITY`                 | `Developer ID Application: China MobileSuzhouSoftware Technology Co.,Ltd (EDCUTHX9T2)` |

Current certificate fingerprint:

```text
Developer ID Application SHA-1: 4DF8D3DA5969BEE8A2F92ABBE6EB7332680D91D9
Expires: 2027-02-01 22:12:15 GMT
```

The workflow sets `REQUIRE_MAC_SIGNING=true` and `REQUIRE_MAC_NOTARIZATION=true` for macOS builds. Missing credentials, unsigned apps, notarization failures, missing stapled tickets, or Gatekeeper rejection all fail the macOS job.

### GitHub Release Token

| Secret     | Value                                                            |
| ---------- | ---------------------------------------------------------------- |
| `GH_TOKEN` | A PAT for `village-way/AionUi` with `repo` and `workflow` scopes |

This token is used by existing tag and release jobs. The built-in `GITHUB_TOKEN` is not enough for every workflow/tag update case because it cannot be granted the `workflow` scope.

### Sentry Source Map Upload

The desktop build validates Sentry upload configuration on `linux-x64`.

| Secret              | Value                                                |
| ------------------- | ---------------------------------------------------- |
| `SENTRY_AUTH_TOKEN` | Sentry auth token                                    |
| `SENTRY_ORG`        | Sentry organization slug                             |
| `SENTRY_PROJECT`    | Sentry project slug                                  |
| `SENTRY_DSN`        | Optional runtime DSN injected into the desktop build |

### Optional S3 Distribution

Only required if `release-distribute.yml` should mirror published release assets to S3.

| Secret          | Value                |
| --------------- | -------------------- |
| `AWS_REGION`    | AWS region           |
| `AWS_ROLE_ARN`  | OIDC role ARN        |
| `AWS_S3_BUCKET` | Release asset bucket |

## Configure Secrets from This Machine

The local `gh` active account may not be `village-way`. Use the explicit token form below so the secrets are written to the fork.

```bash
REPO="village-way/AionUi"
GH_TOKEN_VILLAGE="$(gh auth token -u village-way)"

GH_TOKEN="$GH_TOKEN_VILLAGE" gh secret set BUILD_CERTIFICATE_BASE64 \
  --repo "$REPO" \
  --body "$(base64 -i /Users/devine/ai/vscodium/certs/application.p12 | tr -d '\n')"

GH_TOKEN="$GH_TOKEN_VILLAGE" gh secret set P12_PASSWORD \
  --repo "$REPO" \
  --body "$(python3 - <<'PY'
import re
text = open('/Users/devine/ai/vscodium/sign-local.sh').read()
print(re.search(r'^CERT_P12_PASSWORD="([^"]+)"', text, re.M).group(1), end='')
PY
)"

GH_TOKEN="$GH_TOKEN_VILLAGE" gh secret set APPLE_ID \
  --repo "$REPO" \
  --body "wandepen@163.com"

GH_TOKEN="$GH_TOKEN_VILLAGE" gh secret set APPLE_ID_PASSWORD \
  --repo "$REPO" \
  --body "$(python3 - <<'PY'
import re
text = open('/Users/devine/ai/vscodium/sign-local.sh').read()
print(re.search(r'^APP_PASSWORD="([^"]+)"', text, re.M).group(1), end='')
PY
)"

GH_TOKEN="$GH_TOKEN_VILLAGE" gh secret set TEAM_ID \
  --repo "$REPO" \
  --body "EDCUTHX9T2"

GH_TOKEN="$GH_TOKEN_VILLAGE" gh secret set IDENTITY \
  --repo "$REPO" \
  --body "Developer ID Application: China MobileSuzhouSoftware Technology Co.,Ltd (EDCUTHX9T2)"

GH_TOKEN="$GH_TOKEN_VILLAGE" gh secret set KEYCHAIN_PASSWORD \
  --repo "$REPO" \
  --body "temp-keychain-password"

GH_TOKEN="$GH_TOKEN_VILLAGE" gh secret set GH_TOKEN \
  --repo "$REPO" \
  --body "$GH_TOKEN_VILLAGE"
```

## Validate macOS Signing

1. Run `Manual Build` with `platform=macos-arm64`.
2. Confirm the log contains:
   - `macOS Developer ID certificate imported successfully`
   - `Notarization completed successfully`
   - `Notarization ticket stapled and validated successfully`
   - `macOS app is signed, notarized, stapled, and Gatekeeper accepted`
3. Repeat with `platform=macos-x64`.
4. Download the artifact and verify locally:

```bash
codesign --verify --deep --strict --verbose=2 "/path/to/Zhanlu Work.app"
xcrun stapler validate "/path/to/Zhanlu Work.app"
spctl --assess --type execute --verbose "/path/to/Zhanlu Work.app"
```

## Troubleshooting

- `BUILD_CERTIFICATE_BASE64 secret is required`: the repository secret is missing or empty.
- `Signing identity not found`: `IDENTITY` does not match the imported `application.p12` certificate.
- `Skipping notarization - missing Apple ID credentials and REQUIRE_MAC_NOTARIZATION=true`: configure `APPLE_ID`, `APPLE_ID_PASSWORD`, and `TEAM_ID`.
- `stapler validate` fails: notarization did not complete or the ticket was not stapled to the app bundle.
- `spctl --assess` fails: Gatekeeper does not accept the built app; inspect the notarization log and nested code signing failures.
