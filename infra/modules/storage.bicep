@description('Deploys a Storage Account with required blob containers and Event Grid')
param name string
param location string

resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: name
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {}
}

resource pdfsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  name: '${name}/default/pdfs'
  properties: {
    publicAccess: 'None'
  }
}

resource txtExtractContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  name: '${name}/default/txtExtract'
  properties: {
    publicAccess: 'None'
  }
}

resource imgExtractContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  name: '${name}/default/imgExtract'
  properties: {
    publicAccess: 'None'
  }
}

resource eventGrid 'Microsoft.EventGrid/systemTopics@2022-06-15' = {
  name: '${name}-eventgrid'
  location: location
  properties: {
    source: storageAccount.id
    topicType: 'Microsoft.Storage.StorageAccounts'
  }
}

output storageAccountId string = storageAccount.id
output storageAccountName string = storageAccount.name
