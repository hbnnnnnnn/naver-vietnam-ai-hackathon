import React from "react";
import Icon from "../../../components/AppIcon";
import Image from "../../../components/AppImage";

const OverviewCard = ({ productData, uploadedImages }) => {
  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glass">
          <Icon name="Package" size={20} color="white" />
        </div>
        <h3 className="text-xl font-heading font-semibold gradient-text">
          Product Overview
        </h3>
      </div>
      <div className="space-y-6">
        {/* Product Basic Info */}
        <div className="flex flex-col sm:flex-row gap-4 relative">
          {productData?.category && (
            <div
              className="absolute top-0 right-0 px-4 py-2 rounded-3xl text-xs font-medium text-foreground border border-white/10 shadow-sm"
              style={{
                background: "linear-gradient(100deg, #ff90bb 0%, #f8f8e1 100%)",
              }}
            >
              {productData?.category}
            </div>
          )}
          <div className="flex-shrink-0">
            <div className="flex gap-4">
              {/* Front Image */}
              {uploadedImages?.front && (
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-lg overflow-hidden shadow-glass">
                    <Image
                      src={uploadedImages.front}
                      alt="Product front side"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    Front
                  </span>
                </div>
              )}

              {/* Back Image */}
              {uploadedImages?.back && (
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-lg overflow-hidden shadow-glass">
                    <Image
                      src={uploadedImages.back}
                      alt="Product back side"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    Back
                  </span>
                </div>
              )}

              {/* Fallback to mock image if no uploads */}
              {!uploadedImages?.front &&
                !uploadedImages?.back &&
                productData?.image && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden shadow-glass">
                    <Image
                      src={productData.image}
                      alt={`Product ${productData?.name} from brand ${productData?.brand}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <h4 className="text-lg font-heading font-semibold text-foreground">
                {productData?.name}
              </h4>
              <p className="text-sm text-primary font-medium">
                {productData?.brand}
              </p>
            </div>
          </div>
        </div>

        {/* Suitable Score */}
        {typeof productData?.suitable === 'number' && (
          <div>
            <h5 className="text-sm font-heading font-semibold text-foreground mb-3">
              Skin Compatibility
            </h5>
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${productData.suitable >= 80
                        ? 'bg-gradient-to-r from-green-400 to-green-600'
                        : productData.suitable >= 60
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                          : 'bg-gradient-to-r from-red-400 to-red-600'
                      }`}
                    style={{ width: `${productData.suitable}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm font-medium text-foreground">
                {Math.round(productData.suitable)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {productData.suitable >= 80
                ? 'Highly suitable for your skin type'
                : productData.suitable >= 60
                  ? 'Moderately suitable for your skin type'
                  : 'May not be ideal for your skin type'}
            </p>
          </div>
        )}

        {/* Key Benefits */}
        <div>
          <h5 className="text-sm font-heading font-semibold text-foreground mb-3">
            Key Benefits
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 justify-center ml-5">
            {productData?.benefits?.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm text-foreground font-caption">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewCard;
