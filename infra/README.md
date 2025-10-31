# Infrastructure Bicep Files

This folder contains Bicep templates for deploying the following Azure resources for the D&D Beyond Ripper Tool:

- Resource Group (created outside Bicep or via az cli)
- Storage Account
- Key Vault
- Function App (with System-Managed Identity)

## Usage

1. Create a resource group (if not already created):
   ```sh
   az group create --name ddb-ripper-tool --location <location>
   ```
2. Deploy the Bicep template:
   ```sh
   az deployment group create \
     --resource-group ddb-ripper-tool \
     --template-file main.bicep \
     --parameters @parameters.dev.json
   ```

Edit `parameters.dev.json` as needed for your environment.
