package com.songbunghpc.factory.dto;

import lombok.Data;

@Data // Dùng Lombok để tự tạo Getter/Setter cho nhanh giống Entity của bạn
public class ChangePasswordRequest {
    private String username;
    private String oldPassword;
    private String newPassword;
}