package com.example.backend_ml.web.dto.request;

import lombok.Data;

@Data
public class SegmentationRequest {
    private String filePath;    // Пример: "studies/liver.nii.gz"
    private int sliceIndex;     // Пример: 35
}
