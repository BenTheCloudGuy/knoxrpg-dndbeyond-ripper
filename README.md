# D&D Beyond PDF and Image Ripper

An automated tool for logging into D&D Beyond and extracting content using CobaltSession Token based on what was done by MrPrimate for ddb-adventure-muncher, ddb-importer, ddb-proxy.. We are going to tackle this one part at a time. 
1. Create Bicep 

## Resource Deployment
- Create Bicep Files to deploy the following Resources for this build (Name: ddb-ripper-tool):
   - ResourceGroup 
   - StorageAccount
   - KeyVault
   - FunctionApp (with System-Managed Identity to access other resources)
- The tool is going to run on Azure FunctionApps
- It will store outputs in Azure StorageAccount

## App
