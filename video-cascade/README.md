# Video Gateway Solution

This references [Solace CCTV Solution](https://github.com/orgs/solace-sg-cctv) and uses its Source and Sink Cascade components to transmit RTSP feeds over Solace PubSub+ Broker

Please refer to the relevant repositories for the source code. I have only include the container images for easier reference.

# Run

This folder only contains the source and sink cascade components and does not include the management and gui components. It also does not include Solace PubSub+ and the Source RTSP (e.g. MediaMTX) component.

1. Ensure Solace PubSub+ is up and running.
2. Update Solace PubSub+ connection details
3. Update RTSP feed connection details
4. Execute `docker-compose up -d`