# Security

Please use GitHub’s private vulnerability reporting feature when it is enabled on the public repository. Until a private channel is configured, do not post exploit details, private information, or credentials in a public issue. Ask the maintainer for a private contact without disclosing the sensitive details.

The founding edition is a static site. Contributions contain only bounded JSON data, and no user-provided HTML or JavaScript is executed. Pull request automation has read-only repository permissions and does not receive deployment secrets. Publishing runs separately on trusted main-branch code and only after the owner enables it.

Maintainers should keep dependencies current, review workflow changes carefully, review creator credit and content, and require current validation checks before merging.
