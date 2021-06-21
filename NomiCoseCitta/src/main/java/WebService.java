import com.rabbitmq.client.DeliverCallback;
import io.vertx.core.json.JsonObject;
import io.vertx.core.spi.JsonFactory;
import io.vertx.ext.bridge.BridgeEventType;
import io.vertx.ext.bridge.PermittedOptions;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.BodyHandler;
import io.vertx.ext.web.handler.sockjs.SockJSBridgeOptions;
import io.vertx.ext.web.handler.sockjs.SockJSHandler;
import io.vertx.core.AbstractVerticle;
import io.vertx.ext.web.handler.StaticHandler;
import rabbitMQ.Consumer;
import rabbitMQ.Emitter;
import rabbitMQ.MessageType;
import rabbitMQ.RPCClient;

import java.io.IOException;
import java.util.Arrays;
import java.util.concurrent.TimeoutException;

public class WebService extends AbstractVerticle {

    private Consumer stopConsumer;
    private Integer createdGame;
    private RPCClient emitter;

    public void start() {
        try {
            emitter = new RPCClient();
            stopConsumer = new Consumer("stopRound", stopRound(), MessageType.STOP);
        } catch (IOException | TimeoutException e) {
            e.printStackTrace();
        }
        Router router = Router.router(vertx);
        router.mountSubRouter("/eventbus", eventBusHandler());
        router.mountSubRouter("/api", gameApiRouter());
        router.route().handler(staticHandler());

        vertx.createHttpServer().requestHandler(router).listen(8080);
    }

    private StaticHandler staticHandler() {
        return StaticHandler.create()
                .setCachingEnabled(false);
    }

    private Router gameApiRouter() {

        Router router = Router.router(vertx);
        router.route().handler(BodyHandler.create());

        router.route().consumes("application/json");
        router.route().produces("application/json");

        router.post("/game/create").handler(context -> {
            System.out.println("POST for create");
            System.out.println(context.getBodyAsJson().encodePrettily());
            emitter.call(MessageType.CREATE, context.getBodyAsJson().encode(), response -> {
                System.out.println("inside game create callback " + response);
                context.response()
                        .putHeader("content-type", "text/plain")
                        .setStatusCode(200)
                        .end(response);
            });
        });

        router.post("/game/start/:id").handler(context -> {
            System.out.println("POST for starting the game");
            System.out.println(context.getBodyAsJson().encodePrettily());
            emitter.call(MessageType.START, context.getBodyAsJson().encode(), response -> {
                System.out.println("inside game start callback " + response);
                context.response()
                        .putHeader("content-type", "text/plain")
                        .setStatusCode(200)
                        .end(response);
                context.vertx().eventBus().publish("game." + context.request().getParam("id")+ "/start", response);
            });
        });

        router.post("/game/join/:id").handler(context -> {
            emitter.call(MessageType.JOIN, context.getBodyAsJson().encode(), response -> {
                context.response()
                        .putHeader("content-type", "text/plain")
                        .setStatusCode(200)
                        .end(response);
                if(!response.equals("null")) {
                    context.vertx().eventBus().publish("game." + context.request().getParam("id"), response);
                }
            });
        });

        router.post("/game/words").handler(context -> {
            System.out.println("PAROLE: " + context.getBodyAsJson().encode());
            emitter.call(MessageType.WORDS, context.getBodyAsJson().encode(), response -> {
                context.response()
                        .putHeader("content-type", "text/plain")
                        .setStatusCode(200)
                        .end(response);
                System.out.println(response);
//                if(!response.equals("null")) {
//                    context.vertx().eventBus().publish("game." + context.request().getParam("id"), response);
//                }
            });
        });

       return router;
    }

    private Router eventBusHandler() {
        SockJSBridgeOptions options = new SockJSBridgeOptions ()
                .addInboundPermitted(new PermittedOptions().setAddressRegex("game\\.[0-9]+[\\s\\S]*"))
                .addOutboundPermitted(new PermittedOptions().setAddressRegex("game\\.[0-9]+[\\s\\S]*"));
        return SockJSHandler.create(vertx).bridge(options, event -> {
            if (event.type() == BridgeEventType.SOCKET_CREATED) {
                System.out.println("A socket was created");
            }
//            if (event.type() == BridgeEventType.RECEIVE || event.type() == BridgeEventType.PUBLISH){
//                System.out.println("RECEIVE message: " + event.getRawMessage());
//            }
            if (event.type() == BridgeEventType.SOCKET_CLOSED) {
                System.out.println("A socket was closed" + event.socket().uri());
                JsonObject msg = new JsonObject();
                msg.put("userAddress", event.socket().uri());
                emitter.call(MessageType.DISCONNECT, msg.encode(), response -> {
                    JsonObject js = new JsonObject(response);
                    System.out.println("IN DISCONNECT CALLBACK " + js);
                    vertx.eventBus().publish("game." + js.getString("gameID"), response);
                });
            }
            event.complete(true);
        });
    }

    private DeliverCallback stopRound(){
        return (ctag, delivery) -> {
            JsonObject msg = new JsonObject(new String(delivery.getBody(), "UTF-8"));
            System.out.println("Receive STOP round msg");
            System.out.println("Broadcasting on  "+ "game." + msg.getString("gameID")+"/stop");
            vertx.eventBus().publish("game." + msg.getString("gameID")+"/stop", msg.encode());
        };
    }
}


