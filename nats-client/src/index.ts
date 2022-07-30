import { connect, NatsConnection } from 'nats'
import { natsSubscribe } from './async-subscribe';
(async () => {
  try {
    const nc: NatsConnection = await connect({
      reconnectTimeWait: 10 * 1000, //10s
      pingInterval: 20 * 1000,
      debug: true,
      tls: {
        caFile: './cert/rootCA.pem',
        keyFile: './cert/client-key.pem',
        certFile: './cert/client-cert.pem',
      },
      token: "inipanjangnyaharuslebihdari22character"
    });
    // Do something with the connection
    console.log(`connected to ${nc.getServer()}`);
    natsSubscribe(nc);

    // this promise indicates the client closed
    const done = nc.closed();
 
    // do something with the connection
    console.log("Doing Something")

    // close the connection
    await nc.close();
    // check if the close was OK
    const err = await done;
    if (err) {
      console.log(`error closing:`, err);
    }
  } catch (error) {
    console.log(`Connection Error ${JSON.stringify(error)}`);
  }
})()