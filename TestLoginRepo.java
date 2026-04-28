import com.songbunghpc.factory.repository.LoginRepository;
import com.songbunghpc.factory.entity.Login;

public class TestLoginRepo {
    public static void main(String[] args) {
        LoginRepository repo = new LoginRepository();
        System.out.println("Total users: " + repo.findAll().size());
        System.out.println("User phongdm: " + repo.findByUser("sb.phongdm").isPresent());
    }
}
