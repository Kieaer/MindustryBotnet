package uwu.nekonya.infrastruct;

public interface NetListener {

    default void connected(Connection connection) {
    }

    default void disconnected(Connection connection, DcReason reason) {
    }

    default void received(Connection connection, Object object) {
    }


    default void idle(Connection connection) {
    }

}

