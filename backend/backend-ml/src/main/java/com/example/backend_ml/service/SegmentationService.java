package com.example.backend_ml.service;

import com.example.backend_ml.web.dto.request.SegmentationRequest;
import com.example.backend_ml.web.dto.response.ContourResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;

@Service
@RequiredArgsConstructor
//Заглушка
public class SegmentationService {

    private final StorageService storageService;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Cacheable(value = "segmentations", key = "#request.filePath + ':' + #request.sliceIndex")
    public ContourResponse segment(SegmentationRequest request) {
        try (InputStream inputStream = storageService.downloadFileAsStream(request.getFilePath())) {
            byte[] sliceData = extractSliceData(inputStream, request.getSliceIndex());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            HttpEntity<byte[]> entity = new HttpEntity<>(sliceData, headers);

            String modelUrl = "http://model-api:5000/predict"; // Flask модель
            ResponseEntity<String> modelResponse = restClient.post()
                    .uri("/predict")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(sliceData)
                    .retrieve()
                    .toEntity(String.class);

            List<List<Integer>> contour = objectMapper.readValue(
                    modelResponse.getBody(), new TypeReference<List<List<Integer>>>() {});

            return new ContourResponse(contour);
        } catch (Exception e) {
            throw new RuntimeException("Segmentation failed", e);
        }
    }

    // Заглушка: здесь логика извлечения нужного 2D-среза
    private byte[] extractSliceData(InputStream fileStream, int sliceIndex) throws IOException {
        // В боевом коде: использовать NiBabel (Python) или dcm4che (Java)
        return fileStream.readAllBytes(); // отправим весь файл как заглушку
    }
}

