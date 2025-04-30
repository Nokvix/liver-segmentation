package com.example.backend_ml.web.dto.response;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class FileBaseResponse {
    private String filename;  // имя файла
    private String contentType;  // MIME тип файла
    private long size;  // размер файла
    private String fileUrl;  // URL для скачивания файла
}
