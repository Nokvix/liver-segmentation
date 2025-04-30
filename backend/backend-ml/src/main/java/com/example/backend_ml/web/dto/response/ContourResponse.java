package com.example.backend_ml.web.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ContourResponse {
    private List<List<Integer>> contour; // [[x1, y1], [x2, y2], ...]
}

