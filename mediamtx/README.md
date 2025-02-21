# RTSP Streaming from Video File and/or Webcam

This uses (MediaMTX)[https://github.com/bluenviron/mediamtx] v1.11.3 and (FFMpeg)[https://ffmpeg.org/] v7.1-full to create a RTSP Server to stream either from a video file or a Web Camera.

You can refer to `mediamtx.yml` for the below examples and the explanation of each ffmpeg command.

Please ensure `ffmpeg` is added to your path.

# Stream from Video

```yaml
paths:
  vid:
    runOnDemand: ffmpeg -re -stream_loop -1 -i vid.mp4 -c copy -f rtsp rtsp://localhost:14888/vid
```

The above configuration within uses `runOnDemand` to trigger a ffmpeg command to read from a video file `vid.mp4` and stream it to `rtsp://localhost:14888/vid`.

`runOnDemand` only triggers the command to run when there is a request to the url. You can use others `runOnXXXX` to decide when to trigger the command. Read `mediamtx.yml` for the full documentation.

> You can choose to spin up a container, put the binaries, yaml configuration files, and media files in the container and run it. You would need to expose the relevant ports to access the RTSP server.

# Stream from USB Web Camera

```yaml
paths:
  webcam:
    runOnDemand: ffmpeg -f dshow -rtbufsize 200M -framerate 30 -video_size 3840x2160 -i video="Dell Webcam WB7022" -vf "[in]drawbox=x=0:y=0:w=700:h=60:color=black@1:t=fill, drawtext=text='%{localtime}':fontfile=Aptos-Mono-Bold.ttf:fontsize=60:fontcolor=white:x=10:y=10" -vcodec libx264 -preset ultrafast -tune zerolatency -an -f rtsp rtsp://localhost:14888/webcam
```

The above command triggers `ffmpeg` to use `dshow` (Windows Video Device capture format, previously was wfvcap but it's deprecated) to stream from the camera and encode it with libx264 codec. `input_format` is only supported in Linux so you can skip it in Windows (but specify all other parameters (i.e. framerate and video_size) to ensure the correct camera stream is selected. `-preset ultrafast` and `-tune zerolatency` is used to reduce camera feed latency - can you refer to official documentation (or explanation in `mediamtx.yml` for more option value and information.

# Run

Simply execute `mediamtx [mediamtx.yml]` or `mediamtx.exe [mediamtx.yml]` to start the RTSP Server.

### TODO

containerize this and use USB/IP for webcam

