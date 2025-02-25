#!/bin/bash

if [[ -z "${VIRTUAL_ENV}" ]]; then
	echo "Error: Please run this in a virutal environment instead"
	echo "  e.g. execute: source degirum_env/bin/activate"
	exit
fi

rtsp_file=.rtsp
touch ${rtsp_file}
rtsp_url=`tail -1 ${rtsp_file}`
rtsp_url=${rtsp_url:-none}

echo "Previous RTSP URL is ${rtsp_url}. Press enter to reuse, or enter new RTSP URL: "
read url

if [[ -n "${url}" ]]; then
	rtsp_url=${url}
	echo ${url} >> ${rtsp_file}
fi

model_zoo=hailo_examples/models
model_file=.model
touch ${model_file}
model_name=`tail -1 ${model_file}`
model_name=${model_name:-none}

echo -e "\nSelect model to use:"

for d in `ls -d hailo_examples/models/*/`; do dd=${d%/}; echo "  ${dd:22}"; done

echo "Last model used is ${model_name}. Press enter to reuse or enter new model name:"
read model

if [[ -n ${model} ]]; then
	model_name=${model}
	echo ${model_name} >> ${model_file}
fi

if [[ ! -d "${model_zoo}/${model_name}" ]]; then
	echo "${model_name} is not found in Model Zoo (${model_zoo})"
	exit
fi

python rtsp.py ${rtsp_url} ${model_name}