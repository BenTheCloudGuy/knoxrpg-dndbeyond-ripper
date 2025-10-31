
az ad app federated-credential create \
  --id $AZURE_CLIENT_ID \
  --parameters '{
    "name": "github-oidc-main",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:BenTheCloudGuy/knoxrpg-dndbeyond-ripper:ref:refs/heads/main",
    "description": "OIDC for GitHub Actions main branch",
    "audiences": ["api://AzureADTokenExchange"]
  }'