package com.example.backend_ml.web.controller;

import com.example.backend_ml.service.SegmentationService;
import com.example.backend_ml.web.dto.request.SegmentationRequest;
import com.example.backend_ml.web.dto.response.ContourResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/segment")
@RequiredArgsConstructor
public class SegmentationController {

    private final SegmentationService segmentationService;

    @PostMapping
    public ContourResponse segment(@RequestBody SegmentationRequest request) {
        return segmentationService.segment(request);
    }
}
