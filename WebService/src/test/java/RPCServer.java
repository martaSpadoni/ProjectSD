import com.rabbitmq.client.*;
import org.junit.jupiter.api.Test;
import rabbitMQ.MessageType;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeoutException;
import java.util.function.Function;

public class RPCServer {

    private static final String EXCHANGE_NAME = "Web";
    private final Map<MessageType, Function<String, String>> map;


    public RPCServer(Map<MessageType, Function<String, String>> map) {
        this.map = map;
        try {
            start();
        } catch (IOException | TimeoutException e) {
            e.printStackTrace();
        }
    }

    private Map<String, Function<String,String>> createCallbackMap(Channel channel) throws IOException {
        Map<String, Function<String,String>> callbackMap = new HashMap<>();
        map.forEach((t,c)-> {
            try {
                String queueName = channel.queueDeclare().getQueue();
                channel.queueBind(queueName, EXCHANGE_NAME, t.getType());
                callbackMap.put(queueName, c);
            } catch (IOException e) {
                e.printStackTrace();
            }

        });
        return callbackMap;
    }

    private DeliverCallback getDeliverCallback(Function<String,String> callback, Channel channel, Object monitor){
       return  (consumerTag, delivery) -> {
            AMQP.BasicProperties replyProps = new AMQP.BasicProperties
                    .Builder()
                    .correlationId(delivery.getProperties().getCorrelationId())
                    .build();

            String response = "";
            try {
                response = callback.apply(new String(delivery.getBody(), "UTF-8"));
            } catch (RuntimeException e) {
                System.out.println(" [.] " + e.toString());
            } finally {
                System.out.println("RPC server responding " + response + " in queue " + delivery.getProperties().getReplyTo());
                channel.basicPublish("", delivery.getProperties().getReplyTo(), replyProps, response.getBytes("UTF-8"));
                channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
                // RabbitMq consumer worker thread notifies the RPC server owner thread
                synchronized (monitor) {
                    monitor.notify();
                }
            }
        };
    }


    private void start() throws IOException, TimeoutException {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost(System.getenv("RABBIT_HOST"));
        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {

            channel.exchangeDeclare(EXCHANGE_NAME, "direct");
            var callback = createCallbackMap(channel);

            System.out.println(" [x] Awaiting RPC requests");

            Object monitor = new Object();
            callback.forEach((q,c) -> {
                try {
                    channel.basicConsume(q, false, getDeliverCallback(c,channel,monitor), (consumerTag -> { }));
                } catch (IOException e) {
                    e.printStackTrace();
                }
            });
            // Wait and be prepared to consume the message from RPC client.
            while (true) {
                synchronized (monitor) {
                    try {
                        monitor.wait();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }
        }
    }
}