import degirum as dg, degirum_tools, sys, os

# Choose inference host address
#inference_host_address = "@cloud"
inference_host_address = "@local"

# Choose zoo_url
zoo_url = "hailo_examples/models"
# zoo_url = "../models"

# Set token
#token = degirum_tools.get_token()
token = '' # Leave empty for local inference

# Specify the AI model and video source
if len(sys.argv) >= 2:
	if sys.argv[1] in ["?", "-h", "--help", "/?"]:
		print (f"Usage: {sys.argv[0]} [rtsp url] [model]\n\nModels:")
		for d in os.listdir(zoo_url):
			if os.path.isdir(f"{zoo_url}/{d}"):
				print(f"  {d}")
		exit()
	else:
		print(len(sys.argv))
		video_source = sys.argv[1]
else:
	video_source = "rtsp://10.10.10.143:14888/webcam"  # Replace with your camera RTSP URL
	video_source = "rtsp://localhost:14900/cctv/v1/src/cascade/cam/webcam"
print(f" Sourcing from {video_source}")

if len(sys.argv) >= 3:
	model_name = sys.argv[2]
else:
	model_name = "yolo11s_silu_coco--640x640_quant_hailort_hailo8_1"
print(f" Using model: {model_name}")


# Load the AI model
model = dg.load_model(
    model_name=model_name, 
    inference_host_address=inference_host_address,
    zoo_url=zoo_url,
    token=token,
)

# Run AI inference on the video stream and display the results
with degirum_tools.Display("AI Camera") as output_display:
    for inference_result in degirum_tools.predict_stream(model, video_source):
        output_display.show(inference_result)
