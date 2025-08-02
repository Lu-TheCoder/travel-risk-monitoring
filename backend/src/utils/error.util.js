const getErrorMessage = (error) => 
  error?.message || 
  (error?.code ? `Database Error: ${error.code} - ${error.message || 'Unknown'}` : null) ||
  (typeof error === 'string' ? error : null) ||
  'An unknown error occurred';

module.exports = { getErrorMessage };