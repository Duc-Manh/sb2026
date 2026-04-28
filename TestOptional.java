import java.util.Optional;
import org.springframework.http.ResponseEntity;
import java.util.Map;

public class TestOptional {
    public static void main(String[] args) {
        Optional<String> opt = Optional.of("test");
        ResponseEntity<?> result = opt.map(s -> {
            return ResponseEntity.ok(Map.of("message", "OK"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
