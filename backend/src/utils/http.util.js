//use these funtions to send http responses

// Status codes
const codes = {
  OK: 200,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNSUPPORTED_MEDIA_TYPE: 415,
  INTERNAL_SERVER_ERROR: 500
};

// Generic response helper
const send = (res, status, success, message, data = null) => {
  const response = { success, message };
  if (data !== null) response.data = data;
  return res.status(status).json(response);
};

// Success responses
const ok = (res, data, message = "Success") => send(res, codes.OK, true, message, data);
const noContent = (res) => res.sendStatus(codes.NO_CONTENT);

// Error responses
const badRequest = (res, msg = "Bad Request") => send(res, codes.BAD_REQUEST, false, msg);
const unauthorized = (res, msg = "Unauthorized") => send(res, codes.UNAUTHORIZED, false, msg);
const forbidden = (res, msg = "Forbidden") => send(res, codes.FORBIDDEN, false, msg);
const notFound = (res, msg = "Not Found") => send(res, codes.NOT_FOUND, false, msg);
const conflict = (res, msg = "Conflict") => send(res, codes.CONFLICT, false, msg);
const unsupportedMedia = (res, msg = "Unsupported Media Type") => send(res, codes.UNSUPPORTED_MEDIA_TYPE, false, msg);
const serverError = (res, msg = "Internal Server Error") => send(res, codes.INTERNAL_SERVER_ERROR, false, msg);

module.exports = {
  ...codes,
  ok, noContent, badRequest, unauthorized, forbidden, 
  notFound, conflict, unsupportedMedia, serverError
};