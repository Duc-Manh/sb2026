# Build stage
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM amazoncorretto:17-alpine
WORKDIR /app
COPY --from=build /app/target/factory-0.0.1-SNAPSHOT.jar app.jar
COPY database ./database
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]