package com.songbunghpc.factory;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.songbunghpc.factory.service.LoginService;

@SpringBootTest
class FactoryApplicationTests {
	@Autowired
    private LoginService loginService;
	@Test
	void contextLoads() {
	}

}
