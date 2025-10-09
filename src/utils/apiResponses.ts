import { NextResponse } from 'next/server';

export interface BaseResponse {
  success: boolean;
}

/**
 * Standard success response structure
 */
interface SuccessResponse<T = unknown> extends BaseResponse {
  success: true;
  data: T;
  message?: string;
}

/**
 * Standard error response structure
 */
interface ErrorResponse extends BaseResponse {
  success: false;
  error: string;
}

/**
 * Send a 401 Unauthorized response
 */
export const sendUnauthorized = (error: string = 'Unauthorized'): NextResponse => {
  return NextResponse.json(
    {
      success: false,
      error: error
    } as ErrorResponse,
    { status: 401 }
  );
};

/**
 * Send a 403 Forbidden response
 */
export const sendForbidden = (error: string = 'Forbidden - insufficient permissions'): NextResponse => {
  return NextResponse.json(
    {
      success: false,
      error: error
    } as ErrorResponse,
    { status: 403 }
  );
};

/**
 * Send a 404 Not Found response
 */
export const sendNotFound = (error: string = 'Resource not found'): NextResponse => {
  return NextResponse.json(
    {
      success: false,
      error: error
    } as ErrorResponse,
    { status: 404 }
  );
};

/**
 * Send a 400 Bad Request response
 */
export const sendBadRequest = (error: string = 'Bad request'): NextResponse => {
  return NextResponse.json(
    {
      success: false,
      error: error
    } as ErrorResponse,
    { status: 400 }
  );
};

/**
 * Send a 500 Internal Server Error response
 */
export const sendInternalError = (error: string = 'Internal server error'): NextResponse => {
  return NextResponse.json(
    {
      success: false,
      error: error
    } as ErrorResponse,
    { status: 500 }
  );
};

/**
 * Send a generic error response with custom status code
 */
export const sendError = (statusCode: number, error: string): NextResponse => {
  return NextResponse.json(
    {
      success: false,
      error: error
    } as ErrorResponse,
    { status: statusCode }
  );
};

/**
 * Send a 200 OK success response - typically used for proxy responses
 * where the data is already coming from the backend API
 */
export const sendSuccess = <T = unknown>(data: T, message?: string): NextResponse => {
  return NextResponse.json({
    success: true,
    data: data,
    ...(message && { message })
  } as SuccessResponse<T>);
};

/**
 * Send a 201 Created success response
 */
export const sendCreated = <T = unknown>(data: T, message?: string): NextResponse => {
  return NextResponse.json(
    {
      success: true,
      data: data,
      ...(message && { message })
    } as SuccessResponse<T>,
    { status: 201 }
  );
};

/**
 * Proxy response - pass through the response from backend API
 * This is the most common pattern in Next.js API routes that act as proxies
 */
export const proxyResponse = (data: unknown, status: number = 200): NextResponse => {
  return NextResponse.json(data, { status });
};
