'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './styleFavourite.css'; 

interface Material {
  materialID: number;
  material_name?: string;
  price: number;
}

interface Image {
  imageURL: string;
  is_main: number;
}

interface Product {
  productID?: string;
  product_name: string;
  categoryID: number;
  style: string;
  stock: number;
  description: string;
  materials: Material[];
  images: Image[];
}

export default function Favourite() {
  const [favouriteProducts, setFavouriteProducts] = useState<Product[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [userPerID, setUserPerID] = useState<number | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"; 

  useEffect(() => {
    setIsClient(true);
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      const parsedUserInfo = JSON.parse(storedUserInfo);
      setUserPerID(parsedUserInfo.perID);

      const userFavouritesKey = `favouriteProducts_${parsedUserInfo.perID}`;
      const storedFavourites = localStorage.getItem(userFavouritesKey);
      if (storedFavourites) {
        const parsedFavourites = JSON.parse(storedFavourites);
        if (Array.isArray(parsedFavourites)) {
          const filteredFavourites = parsedFavourites.filter((product: Product) => product.productID);
          setFavouriteProducts(filteredFavourites);

          filteredFavourites.forEach((product: Product) => {
            axios
              .get(`${API_URL}/products/${product.productID}`)
              .then((response) => {
                const data = response.data.data || response.data;
                if (data) {
                  setFavouriteProducts((prev) =>
                    prev.map((p) =>
                      p.productID === product.productID
                        ? {
                            ...p,
                            materials: data.materials,
                            images: data.images.map((img: Image) => ({
                              ...img,
                              imageURL: img.imageURL
                                ? img.imageURL.startsWith('/')
                                  ? `${API_URL}${img.imageURL}`
                                  : img.imageURL
                                : '/images/addImage.png',
                            })),
                          }
                        : p
                    )
                  );
                }
              })
              .catch((error) => {
                console.error('Lỗi khi đồng bộ dữ liệu sản phẩm:', error);
              });
          });
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isClient && userPerID) {
      const userFavouritesKey = `favouriteProducts_${userPerID}`;
      localStorage.setItem(userFavouritesKey, JSON.stringify(favouriteProducts));
    }
  }, [favouriteProducts, isClient, userPerID]);

  const calculateProductPriceRange = (materials: Material[]) => {
    if (!materials || materials.length === 0) return { min: 0, max: 0 };
    const prices = materials.map((material) => material.price).filter((price) => price !== undefined && price !== null);
    if (prices.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  };

  const removeFromFavourite = (productID: string | undefined) => {
    setFavouriteProducts((prev) => prev.filter((fav) => fav.productID !== productID));
  };

  const tableVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 },
    }),
  };

  return (
    <>
      <Header />
      <AnimatePresence>
        {isClient && (
          <motion.div
            key="favourite-content"
            variants={tableVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{ padding: '20px', maxWidth: '1200px', margin: '180px auto' }}
          >
            {favouriteProducts.length > 0 ? (
              <table className="favourite-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Product name</th>
                    <th>Unit price</th>
                    <th>Stock status</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {favouriteProducts.map((product, index) => {
                      const priceRange = calculateProductPriceRange(product.materials);
                      if (!product.productID) return null;
                      return (
                        <motion.tr
                          key={product.productID}
                          variants={rowVariants}
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
                        >
                          <td>
                            <span
                              className="remove-icon"
                              onClick={() => removeFromFavourite(product.productID)}
                            >
                              ✕
                            </span>
                          </td>
                          <td>
                            <div className="name_favourite">
                              <Image
                                src={
                                  product.images.find((img) => img.is_main === 1)?.imageURL ||
                                  product.images[0]?.imageURL ||
                                  '/images/addImage.png'
                                }
                                alt={product.product_name}
                                width={50}
                                height={50}
                              />
                              <Link href={`/USER/details/${product.productID}`}>
                                {product.product_name}
                              </Link>
                            </div>
                          </td>
                          <td>
                            {priceRange.min === 0 && priceRange.max === 0
                              ? 'Không có giá'
                              : priceRange.min === priceRange.max
                              ? `${priceRange.min.toLocaleString('vi-VN')} đ`
                              : `${priceRange.min.toLocaleString('vi-VN')} đ - ${priceRange.max.toLocaleString('vi-VN')} đ`}
                          </td>
                          <td className={product.stock > 0 ? 'in-stock' : 'out-of-stock'}>
                            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '20px' }}
              >
                Bạn chưa có sản phẩm yêu thích nào.
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <Footer />
    </>
  );
}