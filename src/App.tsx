import { useEffect } from 'react';
import { useSettingsStore } from './store/settingsStore';
import WorkspaceLayout from './components/workspace/WorkspaceLayout';

export default function App() {
  const { load } = useSettingsStore();

  useEffect(() => {
    load();
  }, []);

  return <WorkspaceLayout />;
}
