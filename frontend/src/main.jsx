import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux';
import './index.css'
import App from './App.jsx'

import {
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom';
import store from './store.js'

//screens
import Shop from './screens/Shop.jsx'
import Login from './screens/Login.jsx'
import Register from './screens/Register.jsx'
import Profile from './screens/Profile.jsx'
import ProductDetail from './screens/ProductDetail.jsx'
import Cart from './screens/Cart.jsx'
import MyOrders from './screens/MyOrders.jsx'

import AdminDashboard from './screens/AdminDashboard.jsx'
import AdminProducts from './screens/AdminProducts.jsx'
import AdminCreateProduct from './screens/AdminCreateProduct.jsx'
import AdminEditProduct from './screens/AdminEditProduct.jsx'
import AdminViewOrders from './screens/AdminViewOrders.jsx';
import Wishlist from './screens/Wishlist.jsx';

const router = createBrowserRouter([
  {path: '/', element: <App />, children: [
    {index: true, element: <Shop />},
    {path: '/shop', element: <Shop />},
    {path: '/login', element: <Login />},
    {path: '/register', element: <Register />},
    {path: '/profile', element: <Profile />},
    {path: '/product/:id', element: <ProductDetail />},
    {path: '/cart', element: <Cart />},
    {path: '/my-orders', element: <MyOrders />},
    {path: '/wishlist', element: <Wishlist />},

    {path: '/admin/dashboard', element: <AdminDashboard />},
    {path: '/admin/products', element: <AdminProducts />},
    {path: '/admin/create-product', element: <AdminCreateProduct />},
    {path: '/admin/edit-product/:id', element: <AdminEditProduct />},
    {path: '/admin/orders', element: <AdminViewOrders />},
  ]}
])


createRoot(document.getElementById('root')).render(
   <Provider store={store}>
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
  </Provider>
)
