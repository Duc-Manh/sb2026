import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class TestBcrypt {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = "$2a$10$.IQpKIfNxrMYT/xXBx9n/uDguHJzNfm0eOTauLusxcvR/IbxgBila";
        System.out.println("Matches 123456: " + encoder.matches("123456", hash));
    }
}
