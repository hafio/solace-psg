# Overview 

This folder consists of 2 modules:
1. Streaming RTSP over Solace PubSub+
2. AI Processing on RTSP Stream via Solace PubSub+

# Part 1: Streaming RTSP over Solace PubSub+ 

### 1. Start RTSP Server / Source

Refer to [mediamtx](https://github.com/hafio/solace-psg/tree/main/mediamtx) folder to start a RTSP Feed (source from webcam and/or video file)

### 2. Start Solace PubSub+ and Video Gateway Cascades

Use the `docker-compose.yaml` file to spin up:
1. Solace PubSub+ Software (Containerized) Broker - Standard Single Node
2. Solace Video Gateway Solution Source Cascade
3. Solace Video Gateway Solution Sink Cascade

# Part 2: AI Processing on RTSP Stream via Solace PubSub+

Refer to [Solace AI Accelerator Video Detection](https://github.com/acagnetti/solace-ai-accelerator-video-detection). Additional links to read/watch/refer:
- https://www.youtube.com/watch?v=Z6aYwU8xnsA
- https://www.raspberrypi.com/documentation/computers/ai.html
- https://www.raspberrypi.com/documentation/accessories/m2-hat-plus.html#m2-hat-plus
- https://github.com/hailo-ai/hailo-rpi5-examples/tree/main

Install `hailo-rpi5-examples` as per above link (install/run setup)

Install `solace-samples-python` as per above link (install/run setup)

