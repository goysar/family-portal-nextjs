'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageUploaderProps {
  onImageSelect: (croppedImage: File) => void;
  aspectRatio?: number;
  minWidth?: number;
  minHeight?: number;
}

export default function ImageUploader({
  onImageSelect,
  aspectRatio = 1,
  minWidth = 200,
  minHeight = 200,
}: ImageUploaderProps) {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [croppedImage, setCroppedImage] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setCroppedImage(null); // Reset cropped image when new image is selected
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    },
    maxFiles: 1,
  });

  const getCroppedImg = async (image: HTMLImageElement, crop: Crop): Promise<File> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Set canvas size to match the crop size
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Calculate the actual pixel values for the crop
    const pixelRatio = window.devicePixelRatio;
    canvas.width = Math.floor(crop.width * scaleX);
    canvas.height = Math.floor(crop.height * scaleY);

    // Draw the cropped image
    ctx.drawImage(
      image,
      Math.floor(crop.x * scaleX),
      Math.floor(crop.y * scaleY),
      Math.floor(crop.width * scaleX),
      Math.floor(crop.height * scaleY),
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
          resolve(file);
        },
        'image/jpeg',
        0.95 // Quality setting for JPEG
      );
    });
  };

  const handleCropComplete = async () => {
    if (!imageRef || !crop.width || !crop.height) {
      console.error('Missing image reference or crop dimensions');
      return;
    }

    try {
      const croppedImageFile = await getCroppedImg(imageRef, crop);
      setCroppedImage(croppedImageFile);
      onImageSelect(croppedImageFile);
    } catch (e) {
      console.error('Error cropping image:', e);
    }
  };

  return (
    <div className="space-y-4">
      {!image ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-500'}`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              {isDragActive ? (
                <p>Drop the image here ...</p>
              ) : (
                <p>Drag and drop an image, or click to select</p>
              )}
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              aspect={aspectRatio}
              minWidth={minWidth}
              minHeight={minHeight}
            >
              <img
                ref={setImageRef}
                src={image}
                alt="Upload preview"
                className="max-w-full h-auto"
              />
            </ReactCrop>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setImage(null);
                setCroppedImage(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCropComplete}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
            >
              Crop & Save
            </button>
          </div>
          {croppedImage && (
            <div className="mt-4">
              <p className="text-sm text-green-600 mb-2">✓ Image cropped successfully</p>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setCroppedImage(null);
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Upload different image
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 