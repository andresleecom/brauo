# Security

## Verifying a download

Brauo is plain, unminified JavaScript under the MIT license. A release zip contains exactly the files in this repository at the matching tag - nothing is bundled, minified, or obfuscated - so you can audit everything you run.

Every release is built by GitHub Actions and published with:

- a SHA-256 checksum (`brauo-<version>.zip.sha256`), and
- a signed build-provenance (SLSA) attestation.

Check integrity:

```
sha256sum -c brauo-<version>.zip.sha256
```

Verify provenance (that GitHub Actions built the zip from this repository's tagged commit):

```
gh attestation verify brauo-<version>.zip --repo andresleecom/brauo
```

The Chrome Web Store build is additionally reviewed by Google before publication.

## Reporting a vulnerability

Please report security issues privately through a GitHub security advisory:
https://github.com/andresleecom/brauo/security/advisories/new

Do not open a public issue for security reports.
