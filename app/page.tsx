import App from '@/components/App';
import { AppProvider } from '@/components/providers/AppProvider';
import { LogProvider } from '@/components/providers/LogProvider';

export default function HomePage() {
  return (
    <AppProvider>
      <LogProvider>
        <App />
      </LogProvider>
    </AppProvider>
  );
}