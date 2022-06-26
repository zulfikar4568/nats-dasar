import { connect } from 'nats'
(async () => {
  try {
    const nc = await connect({
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