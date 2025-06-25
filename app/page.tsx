'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const Login = dynamic(() => import('./Login/page'));
const Home = dynamic(() => import('./USER/Home/page'));
const Products = dynamic(() => import('./USER/Products/page'));
const Favourites = dynamic(() => import('./USER/favourite/page'));
const Orders = dynamic(() => import('./USER/orders/page'));
const Invoices = dynamic(() => import('./USER/invoices/page'));
const CategoryPage = dynamic(() => import('./USER/categorie/[categoryID]/page'));
const Details = dynamic(() => import('./USER/details/[productID]/page'));

export default function MainPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-[#f8dff6] to-[#e3e3e3]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Home /> 
      </motion.div>
    </div>
  );
}