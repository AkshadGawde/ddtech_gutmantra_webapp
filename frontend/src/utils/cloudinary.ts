export const getCloudinaryImage = (productId: string) => {
  const base = import.meta.env.VITE_CLOUDINARY_BASE_URL;

  return `${base}/f_auto,q_auto,w_800/products/${productId}.png`;
};