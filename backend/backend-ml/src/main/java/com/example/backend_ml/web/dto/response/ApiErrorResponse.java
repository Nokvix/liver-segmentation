package com.example.backend_ml.web.dto.response;

public record ApiErrorResponse(
        String description, String code, String exceptionName, String exceptionMessage) {}
