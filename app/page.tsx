import App from '@/components/App';
import { AppProvider } from '@/components/providers/AppProvider';

export default function HomePage() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}
