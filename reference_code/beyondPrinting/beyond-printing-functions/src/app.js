const { app } = require('@azure/functions');

// Import all function definitions
// This registers all the functions with the Azure Functions runtime
require('./functions/processSourcebook');
require('./functions/processBulk');
require('./functions/checkStatus');
require('./functions/scheduleProcessor');

// Export the app instance
module.exports = app;