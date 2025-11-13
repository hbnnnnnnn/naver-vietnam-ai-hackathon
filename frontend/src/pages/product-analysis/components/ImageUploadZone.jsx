import React, { useState, useRef } from "react";
import Icon from "../../../components/AppIcon";
import Image from "../../../components/AppImage";
import Button from "../../../components/ui/Button";

const ImageUploadZone = ({ type, onImageUpload, uploadedImage }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e?.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e?.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    setIsDragOver(false);

    const files = e?.dataTransfer?.files;
    if (files?.length > 0) {
      handleFileSelect(files?.[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (file && file?.type?.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageUpload(type, e?.target?.result, file);
      };
      reader?.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef?.current?.click();
  };

  const handleRemoveImage = () => {
    onImageUpload(type, null, null);
  };

  return (
    <div className="w-full">
      <div className="mb-3">
        <h3 className="text-lg font-heading font-semibold text-foreground">
          {type === "front" ? "Front Label" : "Back Label"}
        </h3>
        <p className="text-sm text-muted-foreground font-caption">
          {type === "front"
            ? "Take a photo of the front label to analyze basic information"
            : "Take a photo of the back label to analyze detailed ingredients"}
        </p>
      </div>
      <div
        className={`
          relative w-full h-64 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer
          ${
            isDragOver
              ? "border-primary bg-primary/5 scale-105"
              : uploadedImage
              ? "border-success bg-success/5"
              : "border-border hover:border-primary/50 hover:bg-primary/5"
          }
          ${uploadedImage ? "" : "glass-card"}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!uploadedImage ? handleClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {uploadedImage ? (
          <div className="relative w-full h-full">
            <Image
              src={uploadedImage}
              alt={`${
                type === "front" ? "Front Label" : "Back Label"
              } skincare product uploaded for analysis`}
              className="w-full h-full object-cover rounded-lg"
            />

            {/* Image Actions Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e?.stopPropagation();
                    handleClick();
                  }}
                  iconName="RefreshCw"
                  iconPosition="left"
                  iconSize={16}
                  className="bg-white/90 text-gray-800 hover:bg-white"
                >
                  Change
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e?.stopPropagation();
                    handleRemoveImage();
                  }}
                  iconName="Trash2"
                  iconPosition="left"
                  iconSize={16}
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* Success Indicator */}
            <div className="absolute top-3 right-3 w-8 h-8 bg-success rounded-full flex items-center justify-center shadow-glass">
              <Icon name="Check" size={16} color="white" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 shadow-glass">
              <Icon
                name={isDragOver ? "Upload" : "Camera"}
                size={24}
                color="white"
              />
            </div>

            <h4 className="text-lg font-heading font-medium text-foreground mb-2">
              {isDragOver ? "Drop Image Here" : "Upload Image"}
            </h4>

            <p className="text-sm text-muted-foreground mb-4 font-caption">
              Drag and drop an image or click to select a file
            </p>

            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground font-caption">
              <span className="px-2 py-1 bg-muted rounded-md">JPG</span>
              <span className="px-2 py-1 bg-muted rounded-md">PNG</span>
              <span className="px-2 py-1 bg-muted rounded-md">WEBP</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploadZone;
