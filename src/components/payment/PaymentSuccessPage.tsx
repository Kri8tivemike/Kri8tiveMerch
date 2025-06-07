  // Add a title field to the request data to avoid schema validation errors
  requestData.title = product_id 
    ? `Custom ${productName || product_id.substring(0, 8)}` 
    : item_type 
      ? `Custom ${item_type}` 
      : `Customization Request ${new Date().toISOString().split('T')[0]}`;
  
  console.log('Creating customization request with data:', requestData); 