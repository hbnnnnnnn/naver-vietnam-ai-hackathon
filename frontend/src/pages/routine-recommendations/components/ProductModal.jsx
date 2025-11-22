import React, { useState, useEffect } from "react";
import Icon from "../../../components/AppIcon";
import Image from "../../../components/AppImage";
import Button from "../../../components/ui/Button";
import { getCachedImage, getProductImage } from "../../../utils/imageCache";

const ProductModal = ({ isOpen, onClose, category, products, isLoading }) => {
  const [productImages, setProductImages] = useState({});

  useEffect(() => {
    if (!products || products.length === 0) return;

    // Load cached images first
    const initialImages = {};
    products.forEach((product) => {
      const query = `${product.brand} ${product.name} product`;
      const cachedImage = getCachedImage(query);
      if (cachedImage) {
        initialImages[product._id || product.id] = cachedImage;
      }
    });

    // Set cached images immediately
    setProductImages(initialImages);

    // Then fetch missing images
    products.forEach(async (product) => {
      const productId = product._id || product.id;

      // Skip if we already have cached image
      if (initialImages[productId]) {
        console.log("Using cached image for:", product.brand, product.name);
        return;
      }

      const query = `${product.brand} ${product.name} product`;
      console.log("Fetching image for:", query);
      const imageUrl = await getProductImage(query);
      if (imageUrl) {
        console.log("Got image URL:", imageUrl);
        setProductImages((prev) => ({
          ...prev,
          [productId]: imageUrl,
        }));
      } else {
        console.log("No image found for:", query);
      }
    });
  }, [products]);

  if (!isOpen) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    })?.format(price);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-center justify-center">
        <div
          className="rounded-3xl glass-card w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(255,144,187,0.15) 0%, rgba(138,204,213,0.15) 100%)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Icon name="Package" size={20} color="white" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-semibold text-foreground">
                  Product Suggestions: {category?.category}
                </h2>
                <p className="text-sm text-muted-foreground font-caption">
                  {category?.description}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={onClose}
              iconName="X"
              iconSize={20}
              className="p-2 hover:bg-primary hover:text-primary-foreground active:bg-primary/80"
            />
          </div>

          {/* Content */}
          <div className="p-6 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5]?.map((i) => (
                  <div key={i} className="glass-card p-4 animate-pulse">
                    <div className="aspect-square bg-white/20 rounded-lg mb-4"></div>
                    <div className="h-4 bg-white/20 rounded mb-2"></div>
                    <div className="h-3 bg-white/20 rounded mb-2"></div>
                    <div className="h-4 bg-white/20 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products?.map((product) => (
                  <div
                    key={product?.id}
                    className="rounded-xl bg-white/60 glass-card p-4 hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-white/10">
                        <Image
                          src={
                            productImages[product?._id || product?.id] ||
                            product?.image ||
                            "https://via.placeholder.com/300x300/f0f0f0/666?text=No+Image"
                          }
                          alt={product?.imageAlt || product?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="h-12">
                          <h3 className="font-medium text-foreground line-clamp-2">
                            {product?.name}
                          </h3>
                          <p className="text-sm text-muted-foreground font-caption">
                            {product?.brand}
                          </p>
                        </div>

                        <div className="flex items-center justify-between h-10">
                          <span className="text-lg font-semibold text-primary">
                            {formatPrice(product?.price)}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Icon
                              name="Star"
                              size={14}
                              className="text-amber-500 fill-current"
                            />
                            <span className="text-sm text-muted-foreground">
                              {product?.rating}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 h-20">
                          <h4 className="text-sm font-medium text-foreground">
                            Key Ingredients:
                          </h4>
                          <div
                            className="flex flex-wrap gap-1 overflow-hidden"
                            style={{ maxHeight: "3rem" }}
                          >
                            {product?.ingredients
                              ?.slice(0, 3)
                              ?.map((ingredient, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-gradient-primary/20 text-primary rounded-full"
                                >
                                  {ingredient.length > 50
                                    ? `${ingredient.substring(0, 50)}...`
                                    : ingredient}
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-auto">
                      <Button
                        variant="outline"
                        className="w-full border rounded-3xl hover:bg-[rgba(255,144,187,0.2)] border-black"
                        iconName="ExternalLink"
                        iconPosition="right"
                        iconSize={14}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/20 bg-white/5 flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-sm text-muted-foreground font-caption">
                <p>
                  💡 <strong>Tip:</strong> Read the ingredients and reviews
                  before purchasing
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  className="rounded-3xl border hover:bg-[rgba(255,144,187,0.2)] border-black"
                  variant="outline"
                  onClick={onClose}
                  iconName="ArrowLeft"
                  iconPosition="left"
                  iconSize={16}
                >
                  Go Back
                </Button>
                <Button
                  className="rounded-3xl"
                  variant="default"
                  iconName="MessageCircle"
                  iconPosition="left"
                  iconSize={16}
                  onClick={() => {
                    onClose();
                    window.location.href = "/skincare-chatbot";
                  }}
                >
                  Get More Advice
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductModal;
