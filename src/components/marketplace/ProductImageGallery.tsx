"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "next/image";

interface ProductImageGalleryProps {
  images: { url: string }[] | undefined;
}

export function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const productImages = images?.length
    ? images
    : [{ url: "/placeholder.svg" }];

  return (
    <Carousel>
      <CarouselContent>
        {productImages.map((image, index) => (
          <CarouselItem key={index}>
            <AspectRatio ratio={1}>
              <Image
                src={image.url}
                alt={`Product image ${index + 1}`}
                className="object-cover rounded-lg"
                fill
              />
            </AspectRatio>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
