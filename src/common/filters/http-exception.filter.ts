import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP exception filter
 * Handles all HTTP exceptions and formats them in a consistent way
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorMessage = exception.message || 'Internal server error';
    let errorDetails = null;

    // Handle validation errors (BadRequestException with details)
    if (exception instanceof BadRequestException) {
      const exceptionResponse = exception.getResponse() as any;

      // Check if this is a validation error with details
      if (Array.isArray(exceptionResponse.message)) {
        errorMessage = 'Validation failed';
        errorDetails = exceptionResponse.message;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse.message
      ) {
        errorMessage = exceptionResponse.message;
        errorDetails = exceptionResponse.errors || null;
      }
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: errorMessage,
      details: errorDetails,
      error: exception.name,
    };

    this.logger.error(
      `${request.method} ${request.url}`,
      exception.stack,
      'HttpExceptionFilter',
    );

    response.status(status).json(errorResponse);
  }
}
