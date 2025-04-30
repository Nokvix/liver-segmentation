package com.example.backend_ml.service;

import com.example.backend_ml.web.dto.response.FileBaseResponse;
import io.minio.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

@Service
public class StorageService {

    private final MinioClient minioClient;
    private final String bucket;

    public StorageService(@Value("${minio.url}") String url,
                          @Value("${minio.access-key}") String accessKey,
                          @Value("${minio.secret-key}") String secretKey,
                          @Value("${minio.bucketName}") String bucketName) {
        this.bucket = bucketName;
        this.minioClient = MinioClient.builder()
                .endpoint(url)
                .credentials(accessKey, secretKey)
                .build();
        try {
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!found) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
        } catch (Exception e) {
            throw new RuntimeException("MinIO init failed", e);
        }
    }

    // Новый метод для загрузки файлов, использующий MultipartFile
    public void uploadFile(MultipartFile file, String path) throws Exception {
        // Получаем имя файла
        String filename = path + "/" + file.getOriginalFilename();

        // Загружаем файл в Minio
        minioClient.putObject(
                PutObjectArgs.builder()
                        .bucket(bucket)
                        .object(filename)
                        .stream(file.getInputStream(), file.getSize(), -1)
                        .contentType(file.getContentType())
                        .build()
        );
    }

    public FileBaseResponse get(String filename) throws Exception {
        StatObjectResponse stat = minioClient.statObject(StatObjectArgs.builder().bucket(bucket).object(filename).build());

        FileBaseResponse fileBaseResponse = new FileBaseResponse();
        fileBaseResponse.setFilename(filename);
        fileBaseResponse.setContentType(stat.contentType());
        fileBaseResponse.setSize(stat.size());

        String fileUrl = "http://minio-server-url/" + bucket + "/" + filename;
        fileBaseResponse.setFileUrl(fileUrl);

        return fileBaseResponse;
    }

    public void delete(String filename) throws Exception {
        minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(filename).build());
    }

    public InputStream downloadFileAsStream(String path) throws Exception {
        return minioClient.getObject(GetObjectArgs.builder()
                .bucket(bucket)
                .object(path)
                .build());
    }
}


