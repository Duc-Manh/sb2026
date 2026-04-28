package com.songbunghpc.factory.entity;

import lombok.Data;

@Data 
public class Login {

    private Long id;

    // Đổi tên thành username để khớp với Excel
    private String username;

    private String password;

    private String hoten;
    private String chucdanh;
    private String nhamay;
    
    // Thêm cột này
    private String kip; 

    private String sodienthoai;
    private String email;
    private String role;
}