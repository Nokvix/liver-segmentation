package com.example.backend_ml.web.advice;

import com.example.backend_ml.domain.exception.FileStorageException;
import com.example.backend_ml.web.dto.response.ApiErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(FileStorageException.class)
    public ApiErrorResponse handleStorageException(FileStorageException ex) {
        return new ApiErrorResponse(
                "Storage exception",
                HttpStatus.INTERNAL_SERVER_ERROR.toString(),
                ex.getClass().getSimpleName(),
                ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ApiErrorResponse handleGenericException(Exception ex) {
        return new ApiErrorResponse(
                "Unexpected error",
                HttpStatus.INTERNAL_SERVER_ERROR.toString(),
                ex.getClass().getSimpleName(),
                ex.getMessage());
    }
}
