package com.example.backend_ml.web.controller;

import com.example.backend_ml.service.StorageService;
import com.example.backend_ml.web.dto.FileDTO;
import com.example.backend_ml.web.dto.response.FileBaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileController {

    private final StorageService storageService;

    @PostMapping
    public void uploadFile(@ModelAttribute FileDTO fileDTO) throws Exception {
        storageService.uploadFile(fileDTO.getFile(), fileDTO.getPath());
    }

    @GetMapping("/{filename}")
    public FileBaseResponse getFileInfo(@PathVariable String filename) throws Exception {
        return storageService.get(filename);
    }

    @DeleteMapping("/{filename}")
    public ResponseEntity<String> deleteFile(@PathVariable String filename) throws Exception {
        storageService.delete(filename);
        return ResponseEntity.ok("File deleted successfully.");
    }
}

