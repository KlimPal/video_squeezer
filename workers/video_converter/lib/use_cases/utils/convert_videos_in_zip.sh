#!/bin/bash
set -e
input_zip_path=$input_zip_path 
output_zip_path=$output_zip_path 
out_video_ext=$out_video_ext
ffmpeg_options=$ffmpeg_options


tmpDirPath="${output_zip_path%.*}_tmp"
rm -rf $tmpDirPath
set +e
unzip $input_zip_path -d $tmpDirPath
set -e

cur_path=$(pwd)
cd $tmpDirPath

video_files=$(find . -not -path '*/\.*' -type f | grep -E "\.webm$|\.mp4$|\.MP4$|\.mkv$|\.mov$")

for input_file in $video_files; do 
  tmp_name="${input_file}.converted${out_video_ext}"
  echo "$name"
  ffmpeg -i "$input_file" $ffmpeg_options "$tmp_name"
  new_name="${input_file%.*}${out_video_ext}"
  echo $new_name
  rm $input_file
  mv $tmp_name $new_name
done

zip -r $output_zip_path .
rm -rf $tmpDirPath

