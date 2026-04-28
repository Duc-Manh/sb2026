# Sử dụng Amazon Corretto
FROM amazoncorretto:17-alpine

# Thư mục làm việc
WORKDIR /app

# Copy file .jar (Hãy chắc chắn file này đã tồn tại trong target/)
COPY target/factory-0.0.1-SNAPSHOT.jar app.jar

# Mở cổng 8080
EXPOSE 8080

# Chạy ứng dụng
ENTRYPOINT ["java", "-jar", "app.jar"]