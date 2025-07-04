package com.project.festive.festiveserver.common.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.io.File;

@RestController
public class ImageController {
    @GetMapping("/profile-images/{filename:.+}")
    public ResponseEntity<Resource> getImage(@PathVariable("filename") String filename) throws java.net.MalformedURLException {
        Path path = Paths.get("C:/upload/festive/profile/" + filename);
        Resource resource = new UrlResource(path.toUri());
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(resource);
    }

    @GetMapping("/board-images/{filename:.+}")
    public ResponseEntity<Resource> getBoardImage(@PathVariable("filename") String filename) throws java.net.MalformedURLException {
        Path path = Paths.get("C:/upload/festive/board/" + filename);
        Resource resource = new UrlResource(path.toUri());
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(resource);
    }

    @PostMapping("/api/board/upload-image")
    public ResponseEntity<String> uploadBoardImage(@RequestParam("image") MultipartFile file) {
        try {
            String uploadDir = "C:/upload/festive/board/";
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();

            String originalName = file.getOriginalFilename();
            String ext = originalName.substring(originalName.lastIndexOf("."));
            String uuid = UUID.randomUUID().toString();
            String renamed = uuid + ext;

            File dest = new File(uploadDir + renamed);
            file.transferTo(dest);

            String imageUrl = "/board-images/" + renamed;
            return ResponseEntity.ok(imageUrl);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("이미지 업로드 실패");
        }
    }
} 