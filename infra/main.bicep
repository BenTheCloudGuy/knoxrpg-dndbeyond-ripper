// main.bicep
// Deploys Storage Account, Key Vault, and Function Apps with System-Managed Identity

@description('Location for all resources')
param location string = resourceGroup().location

@description('Globally unique name for the Storage Account')
param storageAccountName string

@description('Name for the Key Vault')
param keyVaultName string

@description('Name for the Function App')
param functionAppName string

// Deploy Storage Account with containers and Event Grid
module storage 'modules/storage.bicep' = {
  name: 'storage-deployment'
  params: {
    name: storageAccountName
    location: location
  }
}

// Deploy Key Vault with secrets
module keyVault 'modules/keyvault.bicep' = {
  name: 'keyvault-deployment'
  params: {
    name: keyVaultName
    location: location
  }
}

// Deploy Function Apps
module functionApps 'modules/functionapp.bicep' = {
  name: 'functionapp-deployment'
  params: {
    location: location
    functionAppName: functionAppName
    storageAccountName: storageAccountName
    keyVaultName: keyVaultName
  }
  dependsOn: [
    storage
    keyVault
  ]
}

output storageAccountId string = storage.outputs.storageAccountId
output keyVaultId string = keyVault.outputs.keyVaultId
output authFetchFunctionAppId string = functionApps.outputs.authFetchFunctionAppId
output pdfFetchFunctionAppId string = functionApps.outputs.pdfFetchFunctionAppId
output imgExtractFunctionAppId string = functionApps.outputs.imgExtractFunctionAppId
output txtExtractFunctionAppId string = functionApps.outputs.txtExtractFunctionAppId
