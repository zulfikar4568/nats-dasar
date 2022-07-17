import { NatsConnection, StringCodec } from 'nats'
export async function natsSubscribe(nc: NatsConnection) {
  const sc = StringCodec();
  nc.subscribe("updates", {
    callback: (err, msg) => {
      if (err) {
        console.error(err)
      } else {
        console.info(msg)
      }
    },
    max: 1
  })

  const sub = nc.subscribe("updates", { max: 1 });
  for await (const m of sub) {
    console.log(sc.decode(m.data));
  }
  // nats pub -s nats://inipanjangnyaharuslebihdari22character@localhost:4222 updates "Testt"
  sub.closed
    .then(() => {
      console.info("subscription closed");
    })
    .catch((err) => {
      console.info(`subscription closed with an error ${err.message}`);
    });
}