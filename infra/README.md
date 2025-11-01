# Infrastructure Bicep Files

This folder contains Bicep templates for deploying the following Azure resources for the D&D Beyond Ripper Tool:

- Resource Group (created with main.bicep)
- Storage Account (module)
  - Used for FunctionApp
  - Blob Containter (pdfs)
  - Blob Container (txtExtract)
  - Blob Container (imgExtract)
  - EventGrid
- Key Vault (module)
  - [secret] JWT_token --> JWT_Token for DDB Auth Injected by FunctionApp
  - [secret] CobaltToken --> Injected by FunctionApp
  - [secret] ddb_username --> Pulled from RepoSecret ($ddb_username) in workflow
  - [secret] ddb_password --> Pulled from RepoSecret ($ddb_password) in workflow
- Function App (module)
  - Managed Identity with access to Storage Account (blob contributor), Key Vault (Secrets)
  - NodeJS v20 FunctionApp (authFetch)
    - Using ddb_username (KV) & ddb_password (KV) to Auth to D&DBeyond (google account) to get CobaltToken
    - Use CobaltToken to fetch JWT Token
  - NodeJS v20 FunctionApp (pdfFetch)
    - Using JWTToken - auth and get list of books avaialble to user
    - ForEach Book Download and Convert to PDF
    - Upload pdf to StorageAccount (Container: pdfs)
  - NodeJS v20 FunctionApp (imgExtract)
    - Extract Images from PDFS and Store on Storage Accout (Container: imgExtract)
  - NodeJS v20 FunctionApp (txtExtract)
    - convert PDF to TXT (Container: txtExtract)

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
