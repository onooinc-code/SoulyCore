import React from 'react';
import App from '../components/App';
import { AppProvider } from '../components/providers/AppProvider';

const HomePage: React.FC = () => {
    return (
        <AppProvider>
            <App />
        </AppProvider>
    );
};

export default HomePage;
