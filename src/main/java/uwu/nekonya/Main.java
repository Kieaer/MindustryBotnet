package uwu.nekonya;

import uwu.nekonya.infrastruct.Coders;

public class Main {

    public static void main(String[] args) {
        // You can use Seq<ChatEntity> for multiple bots
        var bot = new ChatEntity("server.ip",
                6567,
                "bot",
                false);

        // For the life of bots
        while (true) {
            bot.sendChatMessage("Hi!");
        }

    }

    public static String usid() {
        byte[] bytes = new byte[8];
        Coders.nextBytes(bytes);
        return new String(Coders.encode(bytes));
    }

    public static String uuid() {
        byte[] result = new byte[8];
        Coders.nextBytes(result);
        return new String(Coders.encode(result));
    }

}
