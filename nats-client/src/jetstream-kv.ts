import { StringCodec } from "nats";
import { NatsHelper } from "./nats.helper";


export async function keyValueExample() {
  try {
    const sc = StringCodec();

    const nc = (await NatsHelper.getConnection())

    const jsm = await nc.jetstreamManager();

    const js = await nc.jetstream();

    // Buat bucket
    const kv = await js.views.kv("kremes_topics", { history: 5 });

    // Buat key Value
    await kv.put("kreMES.DashboardID.123.DeviceID.123.TopicID.123.Topic.test", sc.encode("BAR"));

    // Ambil informasi value dari key
    const e = await kv.get("kreMES.DashboardID.123.DeviceID.123.TopicID.123.Topic.test");
    
    // Decoding value dari key
    if (e) console.log(sc.decode(e?.value))
    
    //Get all key dari bucket
    const keys = await kv.keys();
    const buf: string[] = [];
    await (async () => {
      for await (const k of keys) {
        buf.push(k);
      }
    })();
    console.log(buf)

    // Ambil history dari key
    let h = await kv.history({ key: "kreMES.DashboardID.123.DeviceID.123.TopicID.123.Topic.test" });
    await (async () => {
      for await (const e of h) {

        console.log(e)
        // do something with the historical value
        // you can test e.operation for "PUT", "DEL", or "PURGE"
        // to know if the entry is a marker for a value set
        // or for a deletion or purge.
      }
    })();

    // Hapus key tetapi history tetep ada
    // await kv.delete("kreMES.DashboardID.123.DeviceID.123.TopicID.123.Topic.test");

    // Hapus key tetapi history akan di hapus
    // await kv.purge("kreMES.DashboardID.123.DeviceID.123.TopicID.123.Topic.test");

  } catch (error) {
    console.log(`Connection Error ${JSON.stringify(error)}`);
  }
}