import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('driverToken');
    const location = useLocation();

    if (!token) {
        // Only show toast if they are actually trying to access a restricted area
        const isPublic = ["/login", "/mpin-login"].includes(location.pathname);
        
        if (!isPublic) {
            toast.error('Access Denied. Please Login.');
        }

        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default PrivateRoute;